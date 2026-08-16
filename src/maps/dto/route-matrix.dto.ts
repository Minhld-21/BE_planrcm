import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class MapCoordinatesDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class RouteMatrixDestinationDto extends MapCoordinatesDto {
  @IsString()
  id: string;
}

export class RouteMatrixDto {
  @ValidateNested()
  @Type(() => MapCoordinatesDto)
  origin: MapCoordinatesDto;

  @IsArray()
  @ArrayMaxSize(36)
  @ValidateNested({ each: true })
  @Type(() => RouteMatrixDestinationDto)
  destinations: RouteMatrixDestinationDto[];
}
