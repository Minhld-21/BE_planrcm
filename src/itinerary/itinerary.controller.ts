import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/auth-user.interface';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';
import { GuestItineraryLimitGuard } from './guest-itinerary-limit.guard';
import { ItineraryService } from './itinerary.service';

@Controller('itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard, GuestItineraryLimitGuard)
  generate(
    @Body() dto: GenerateItineraryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.itineraryService.generate(dto, request.user);
  }
}
