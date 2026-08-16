import { ItineraryResponse } from '../shared/interfaces';
import { PlaceLocation } from '../shared/interfaces';

export type PlanVisibility = 'private' | 'public';

export interface PlanAuthor {
  name: string;
  avatarUrl?: string;
}

export interface SavedPlan {
  id: string;
  userId: string;
  createdAt: string;
  visibility: PlanVisibility;
  publishedAt?: string;
  itinerary: ItineraryResponse;
}

export interface PublicPlanSummary {
  id: string;
  createdAt: string;
  publishedAt: string;
  author: PlanAuthor;
  destination: string;
  destinationLocation?: PlaceLocation;
  totalDays: number;
  theme: string[];
}

export interface PublicPlan extends PublicPlanSummary {
  itinerary: ItineraryResponse;
}
