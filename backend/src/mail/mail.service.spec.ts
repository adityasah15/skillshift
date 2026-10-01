import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  const values: Record<string, string> = {
    SMTP_HOST: 'smtp.test.local',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'smtp-user',
    SMTP_PASS: 'smtp-password',
    APP_URL: 'http://localhost:3001/',
    NODE_ENV: 'development',
  };
  const sendMail = jest.fn().mockResolvedValue(undefined);

  beforeEach(async () => {
    Object.assign(values, {
      SMTP_HOST: 'smtp.test.local',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'smtp-user',
      SMTP_PASS: 'smtp-password',
      APP_URL: 'http://localhost:3001/',
      NODE_ENV: 'development',
    });
    jest.clearAllMocks();
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail,
    } as never);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => values[key] ?? fallback),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('requires an SMTP host', () => {
    values.SMTP_HOST = '';
    const config = {
      get: (key: string, fallback?: string) => values[key] ?? fallback,
    };

    expect(() => new MailService(config as ConfigService)).toThrow(
      'SMTP_HOST must be configured before starting the API.',
    );
  });

  it('rejects Ethereal SMTP in production', () => {
    values.SMTP_HOST = 'smtp.ethereal.email';
    values.NODE_ENV = 'production';
    const config = {
      get: (key: string, fallback?: string) => values[key] ?? fallback,
    };

    expect(() => new MailService(config as ConfigService)).toThrow(
      'Ethereal SMTP is for development only. Configure a real SMTP provider in production.',
    );
  });

  it('allows the development SMTP setup and applies transport settings', () => {
    values.SMTP_HOST = 'smtp.ethereal.email';
    values.SMTP_SECURE = 'true';

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.test.local',
      port: 587,
      secure: false,
      auth: { user: 'smtp-user', pass: 'smtp-password' },
    });

    const config = {
      get: (key: string, fallback?: string) => values[key] ?? fallback,
    };
    expect(() => new MailService(config as ConfigService)).not.toThrow();
    expect(nodemailer.createTransport).toHaveBeenLastCalledWith({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: true,
      auth: { user: 'smtp-user', pass: 'smtp-password' },
    });
  });

  it('uses the configured frontend paths and encodes email link parameters', async () => {
    await service.sendVerificationEmail('person+tag@example.com', 'verify token');
    await service.sendPasswordResetEmail('person+tag@example.com', 'reset token');

    expect(sendMail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        html: expect.stringContaining(
          'http://localhost:3001/auth/verify-email?email=person%2Btag%40example.com&token=verify%20token',
        ),
      }),
    );
    expect(sendMail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        html: expect.stringContaining(
          'http://localhost:3001/auth/reset-password?token=reset%20token&email=person%2Btag%40example.com',
        ),
      }),
    );
  });
});
