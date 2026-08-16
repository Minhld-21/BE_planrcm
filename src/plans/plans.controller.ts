import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { RequiredJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth-user.interface';
import { UpdatePlanVisibilityDto } from './dto/update-plan-visibility.dto';
import { PlansService } from './plans.service';

@Controller('plans')
@SkipThrottle()
@UseGuards(RequiredJwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  findMine(@Req() request: AuthenticatedRequest) {
    return this.plansService.findByUserId(request.user!.id);
  }

  @Patch(':planId/visibility')
  updateVisibility(
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanVisibilityDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.plansService.setVisibility(
      request.user!,
      planId,
      dto.isPublic ? 'public' : 'private',
    );
  }
}
