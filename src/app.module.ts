import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ItineraryModule } from './itinerary/itinerary.module';
import { MapsModule } from './maps/maps.module';
import { PlansModule } from './plans/plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: readPositiveInteger(
              config.get<string>('THROTTLE_TTL_MS'),
              60_000,
            ),
            limit: readPositiveInteger(config.get<string>('THROTTLE_LIMIT'), 5),
          },
        ],
        // One quota per IP for the complete API, not a separate quota per route.
        generateKey: (_context, tracker, throttlerName) =>
          `${throttlerName}:${tracker}`,
        errorMessage:
          'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau một phút.',
      }),
    }),
    AiModule,
    AuthModule,
    MapsModule,
    ItineraryModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

function readPositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
