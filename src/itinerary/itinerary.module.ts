import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MapsModule } from '../maps/maps.module';
import { PlansModule } from '../plans/plans.module';
import { GuestItineraryLimitGuard } from './guest-itinerary-limit.guard';
import { ItineraryController } from './itinerary.controller';
import { ItineraryService } from './itinerary.service';

@Module({
  imports: [AuthModule, MapsModule, PlansModule],
  controllers: [ItineraryController],
  providers: [ItineraryService, GuestItineraryLimitGuard],
})
export class ItineraryModule {}
