import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { CreatePlanDto } from './dto/create-plan.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('plan')
  @HttpCode(HttpStatus.OK)
  createPlan(@Body() dto: CreatePlanDto) {
    return this.aiService.createPlan(dto);
  }
}
