import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MapsModule } from '../maps/maps.module';
import { MarketController } from './market.controller';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [AuthModule, MapsModule],
  controllers: [PlansController, MarketController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
