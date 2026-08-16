import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerException, ThrottlerStorage } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth-user.interface';

const GUEST_LIMIT = 1;
const GUEST_THROTTLER_NAME = 'guest-itinerary';

@Injectable()
export class GuestItineraryLimitGuard implements CanActivate {
  constructor(
    @Inject(ThrottlerStorage)
    private readonly throttlerStorage: ThrottlerStorage,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();

    if (request.user) {
      return true;
    }

    const ttl = this.getGuestQuotaTtl();
    const tracker = getRequestTracker(request);
    const result = await this.throttlerStorage.increment(
      `guest-itinerary:${tracker}`,
      ttl,
      GUEST_LIMIT,
      ttl,
      GUEST_THROTTLER_NAME,
    );

    if (result.isBlocked) {
      const response = http.getResponse<Response>();
      response.setHeader('Retry-After', Math.max(1, result.timeToBlockExpire));
      throw new ThrottlerException(
        'Khách chỉ có một lượt tạo lịch trình mỗi 24 giờ. Hãy đăng nhập Google để lưu và tùy chỉnh hành trình.',
      );
    }

    return true;
  }

  private getGuestQuotaTtl(): number {
    const value = Number(this.config.get<string>('GUEST_ITINERARY_TTL_MS'));

    return Number.isInteger(value) && value > 0 ? value : 86_400_000;
  }
}

function getRequestTracker(request: Request): string {
  return request.ip || request.socket.remoteAddress || 'unknown';
}
