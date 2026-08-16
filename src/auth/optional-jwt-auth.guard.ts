import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_SESSION_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './auth-user.interface';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.authService.getSessionUser(
      request.cookies?.[AUTH_SESSION_COOKIE] as string | undefined,
    );

    if (user) {
      request.user = user;
    } else {
      delete request.user;
    }

    return true;
  }
}

@Injectable()
export class RequiredJwtAuthGuard extends OptionalJwtAuthGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException(
        'Hãy đăng nhập Google để xem lịch trình đã lưu.',
      );
    }

    return true;
  }
}
