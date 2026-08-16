import { IsBoolean } from 'class-validator';

export class UpdatePlanVisibilityDto {
  @IsBoolean()
  isPublic: boolean;
}
