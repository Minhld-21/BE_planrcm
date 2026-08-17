import { IsNotEmpty, IsObject } from 'class-validator';
import { ItineraryResponse } from '../../shared/interfaces';

/** The editor sends the complete itinerary so days and activity order stay atomic. */
export class UpdatePlanDto {
  @IsObject()
  @IsNotEmpty()
  itinerary!: ItineraryResponse;
}
