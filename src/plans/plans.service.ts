import {
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  App,
  applicationDefault,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { AuthenticatedUser } from '../auth/auth-user.interface';
import { MapsService } from '../maps/maps.service';
import { ItineraryResponse } from '../shared/interfaces';
import {
  PlanAuthor,
  PlanVisibility,
  PublicPlan,
  PublicPlanSummary,
  SavedPlan,
} from './plan.interface';

type StoredPlan = {
  userId: string;
  createdAt: Timestamp;
  visibility?: PlanVisibility;
  publishedAt?: Timestamp;
  itinerary: ItineraryResponse;
};

type StoredPublicPlan = {
  userId: string;
  createdAt: Timestamp;
  publishedAt: Timestamp;
  author: PlanAuthor;
  itinerary: ItineraryResponse;
};

const MARKET_PLANS_COLLECTION = 'marketPlans';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);
  private firestore: Firestore | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly mapsService: MapsService,
  ) {}

  async save(
    user: AuthenticatedUser,
    itinerary: ItineraryResponse,
  ): Promise<SavedPlan> {
    const plan: SavedPlan = {
      id: randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      visibility: 'private',
      itinerary,
    };

    try {
      await this.getFirestore()
        .collection('users')
        .doc(user.id)
        .collection('plans')
        .doc(plan.id)
        .set({
          userId: plan.userId,
          createdAt: Timestamp.fromDate(new Date(plan.createdAt)),
          visibility: plan.visibility,
          itinerary: plan.itinerary,
        } satisfies StoredPlan);

      return plan;
    } catch (error) {
      throw this.toFirestoreException(error);
    }
  }

  async findByUserId(userId: string): Promise<SavedPlan[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection('users')
        .doc(userId)
        .collection('plans')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((document) =>
        this.toSavedPlan(document.id, document.data() as StoredPlan),
      );
    } catch (error) {
      throw this.toFirestoreException(error);
    }
  }

  async setVisibility(
    user: AuthenticatedUser,
    planId: string,
    visibility: PlanVisibility,
  ): Promise<SavedPlan> {
    try {
      const firestore = this.getFirestore();
      const planReference = firestore
        .collection('users')
        .doc(user.id)
        .collection('plans')
        .doc(planId);
      const snapshot = await planReference.get();

      if (!snapshot.exists) {
        throw new NotFoundException('Không tìm thấy lịch trình cần cập nhật.');
      }

      const storedPlan = snapshot.data() as StoredPlan;
      const itinerary =
        visibility === 'public'
          ? await this.mapsService.enrichItineraryLocations(
              storedPlan.itinerary,
            )
          : storedPlan.itinerary;
      const now = Timestamp.now();
      const batch = firestore.batch();

      batch.update(planReference, {
        visibility,
        ...(visibility === 'public' ? { publishedAt: now } : {}),
        ...(visibility === 'public' ? { itinerary } : {}),
      });

      const marketReference = firestore
        .collection(MARKET_PLANS_COLLECTION)
        .doc(planId);

      if (visibility === 'public') {
        batch.set(marketReference, {
          userId: user.id,
          createdAt: storedPlan.createdAt,
          publishedAt: now,
          author: this.toPlanAuthor(user),
          itinerary,
        } satisfies StoredPublicPlan);
      } else {
        batch.delete(marketReference);
      }

      await batch.commit();

      const savedPlan = this.toSavedPlan(planId, storedPlan);

      return {
        id: savedPlan.id,
        userId: savedPlan.userId,
        createdAt: savedPlan.createdAt,
        visibility,
        itinerary,
        ...(visibility === 'public'
          ? { publishedAt: now.toDate().toISOString() }
          : {}),
      };
    } catch (error) {
      throw this.toFirestoreException(error);
    }
  }

  async findPublicPlans(): Promise<PublicPlanSummary[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(MARKET_PLANS_COLLECTION)
        .orderBy('publishedAt', 'desc')
        .limit(36)
        .get();

      return snapshot.docs.map((document) =>
        this.toPublicPlanSummary(
          document.id,
          document.data() as StoredPublicPlan,
        ),
      );
    } catch (error) {
      throw this.toFirestoreException(error);
    }
  }

  async findPublicPlan(planId: string): Promise<PublicPlan> {
    try {
      const snapshot = await this.getFirestore()
        .collection(MARKET_PLANS_COLLECTION)
        .doc(planId)
        .get();

      if (!snapshot.exists) {
        throw new NotFoundException(
          'Lịch trình này không còn được chia sẻ công khai.',
        );
      }

      const storedPlan = snapshot.data() as StoredPublicPlan;

      return {
        ...this.toPublicPlanSummary(planId, storedPlan),
        itinerary: storedPlan.itinerary,
      };
    } catch (error) {
      throw this.toFirestoreException(error);
    }
  }

  private getFirestore(): Firestore {
    if (this.firestore) {
      return this.firestore;
    }

    const projectId =
      this.config.get<string>('FIREBASE_PROJECT_ID') ??
      this.config.get<string>('GOOGLE_CLOUD_PROJECT');

    if (!projectId) {
      throw new ServiceUnavailableException(
        'Cloud Firestore chưa được cấu hình. Hãy thêm FIREBASE_PROJECT_ID và Google Application Default Credentials vào .env của backend.',
      );
    }

    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialsPath && !existsSync(credentialsPath)) {
      // google-auth-library resolves this path with a synchronous fs.realpathSync
      // call that escapes the try/catch around every Firestore operation below
      // and crashes the whole process. Fail fast here instead.
      throw new ServiceUnavailableException(
        'Cloud Firestore chưa được cấu hình. Hãy kiểm tra GOOGLE_APPLICATION_CREDENTIALS trỏ đúng tới service-account JSON.',
      );
    }

    const app = this.getFirebaseApp(projectId);
    this.firestore = getFirestore(app);

    return this.firestore;
  }

  private getFirebaseApp(projectId: string): App {
    const appName = 'planrcm';
    const existingApp = getApps().find((app) => app.name === appName);

    return (
      existingApp ??
      initializeApp(
        {
          credential: applicationDefault(),
          projectId,
        },
        appName,
      )
    );
  }

  private toSavedPlan(id: string, plan: StoredPlan): SavedPlan {
    const visibility = plan.visibility ?? 'private';

    return {
      id,
      userId: plan.userId,
      createdAt: plan.createdAt.toDate().toISOString(),
      visibility,
      ...(visibility === 'public' && plan.publishedAt
        ? { publishedAt: plan.publishedAt.toDate().toISOString() }
        : {}),
      itinerary: plan.itinerary,
    };
  }

  private toPlanAuthor(user: AuthenticatedUser): PlanAuthor {
    return {
      name: user.name,
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    };
  }

  private toPublicPlanSummary(
    id: string,
    plan: StoredPublicPlan,
  ): PublicPlanSummary {
    return {
      id,
      createdAt: plan.createdAt.toDate().toISOString(),
      publishedAt: plan.publishedAt.toDate().toISOString(),
      author: plan.author,
      destination: plan.itinerary.destination,
      ...(plan.itinerary.destinationLocation
        ? { destinationLocation: plan.itinerary.destinationLocation }
        : {}),
      totalDays: plan.itinerary.totalDays,
      theme: plan.itinerary.theme,
    };
  }

  private toFirestoreException(error: unknown): HttpException {
    if (
      error instanceof ServiceUnavailableException ||
      error instanceof NotFoundException
    ) {
      return error;
    }

    this.logger.error(
      'Cloud Firestore operation failed',
      error instanceof Error ? error.stack : error,
    );

    return new ServiceUnavailableException(
      'Không thể truy cập Cloud Firestore. Hãy kiểm tra FIREBASE_PROJECT_ID và Google Application Default Credentials.',
    );
  }
}
