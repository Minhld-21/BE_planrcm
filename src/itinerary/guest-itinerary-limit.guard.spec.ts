import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerException, ThrottlerStorage } from '@nestjs/throttler';
import { GuestItineraryLimitGuard } from './guest-itinerary-limit.guard';

describe('GuestItineraryLimitGuard', () => {
  const increment = jest.fn();
  const storage = { increment } as unknown as ThrottlerStorage;
  const guard = new GuestItineraryLimitGuard(storage, {
    get: jest.fn().mockReturnValue('86400000'),
  } as unknown as ConfigService);

  function createContext(user?: { id: string }): ExecutionContext {
    const response = { setHeader: jest.fn() };
    const request = {
      user,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows the first guest generation request', async () => {
    increment.mockResolvedValue({
      totalHits: 1,
      timeToExpire: 86_400,
      isBlocked: false,
      timeToBlockExpire: 0,
    });

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(increment).toHaveBeenCalledWith(
      'guest-itinerary:127.0.0.1',
      86_400_000,
      1,
      86_400_000,
      'guest-itinerary',
    );
  });

  it('blocks the second guest generation request', async () => {
    increment.mockResolvedValue({
      totalHits: 2,
      timeToExpire: 86_400,
      isBlocked: true,
      timeToBlockExpire: 86_400,
    });

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      ThrottlerException,
    );
  });

  it('does not apply the guest quota to an authenticated user', async () => {
    await expect(
      guard.canActivate(createContext({ id: 'google-user-id' })),
    ).resolves.toBe(true);
    expect(increment).not.toHaveBeenCalled();
  });
});
