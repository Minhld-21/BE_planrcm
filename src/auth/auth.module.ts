import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  OptionalJwtAuthGuard,
  RequiredJwtAuthGuard,
} from './optional-jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_SECRET') ??
          'google-oauth-not-configured-change-me',
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OptionalJwtAuthGuard, RequiredJwtAuthGuard],
  exports: [AuthService, OptionalJwtAuthGuard, RequiredJwtAuthGuard],
})
export class AuthModule {}
