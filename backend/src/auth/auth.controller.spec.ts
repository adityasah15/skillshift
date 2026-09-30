import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('sets the refresh token as an HttpOnly cookie and returns only the access token', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await controller.login(
        {
          email: 'test@example.com',
          password: 'password',
        },
        response,
      );

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });

      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/auth',
        }),
      );

      expect(result).toEqual({
        accessToken: 'access-token',
      });

      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  describe('refresh', () => {
    it('reads the refresh token from the cookie and rotates the cookie', async () => {
      authService.refresh.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const request = {
        cookies: {
          refreshToken: 'old-refresh-token',
        },
      };

      const result = await controller.refresh(
        request as never,
        response as never,
      );

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');

      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/auth',
        }),
      );

      expect(result).toEqual({
        accessToken: 'new-access-token',
      });

      expect(result).not.toHaveProperty('refreshToken');
    });

    it('rejects a refresh request without a refresh cookie', async () => {
      const request = {
        cookies: {},
      };

      await expect(
        controller.refresh(request as never, response as never),
      ).rejects.toThrow('Refresh token is required');

      expect(authService.refresh).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes the refresh token for the authenticated user and clears the cookie', async () => {
      authService.logout.mockResolvedValue({
        message: 'Logged out successfully',
      });

      const request = {
        user: {
          id: 'user-123',
        },
        cookies: {
          refreshToken: 'refresh-token',
        },
      };

      await controller.logout(request as never, response as never);

      expect(authService.logout).toHaveBeenCalledWith(
        'user-123',
        'refresh-token',
      );

      expect(response.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/auth',
        }),
      );
    });

    it('uses the JWT subject when the authenticated user has no id property', async () => {
      const request = {
        user: {
          sub: 'user-123',
        },
        cookies: {
          refreshToken: 'refresh-token',
        },
      };

      await controller.logout(request as never, response as never);

      expect(authService.logout).toHaveBeenCalledWith(
        'user-123',
        'refresh-token',
      );
    });

    it('clears the cookie even when no refresh token is present', async () => {
      const request = {
        user: {
          id: 'user-123',
        },
        cookies: {},
      };

      await controller.logout(request as never, response as never);

      expect(authService.logout).not.toHaveBeenCalled();

      expect(response.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/auth',
        }),
      );
    });
  });
});
