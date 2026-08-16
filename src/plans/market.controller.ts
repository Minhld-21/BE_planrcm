import { Controller, Get, Param } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PlansService } from './plans.service';

@Controller('market/plans')
@SkipThrottle()
export class MarketController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  findPublicPlans() {
    return this.plansService.findPublicPlans();
  }

  @Get(':planId')
  findPublicPlan(@Param('planId') planId: string) {
    return this.plansService.findPublicPlan(planId);
  }
}
