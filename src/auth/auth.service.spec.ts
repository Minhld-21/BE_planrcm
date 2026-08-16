import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const service = new AuthService(
    {
      get: jest.fn().mockReturnValue('http://localhost:3001'),
    } as unknown as ConfigService,
    {} as JwtService,
  );

  it('keeps OAuth return paths inside the frontend application', () => {
    expect(service.getSafeReturnPath('/itinerary?from=login')).toBe(
      '/itinerary?from=login',
    );
    expect(service.getSafeReturnPath('https://attacker.example')).toBe('/');
    expect(service.getSafeReturnPath('//attacker.example')).toBe('/');
  });
});
