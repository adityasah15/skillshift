import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const mailFrom = this.configService.get<string>('MAIL_FROM');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (!smtpHost) {
      throw new Error('SMTP_HOST must be configured before starting the API.');
    }
    if (!mailFrom) {
      throw new Error('MAIL_FROM must be configured before starting the API.');
    }
    if (nodeEnv === 'production' && smtpHost.includes('ethereal.email')) {
      throw new Error(
        'Ethereal SMTP is for development only. Configure a real SMTP provider in production.',
      );
    }

    this.appUrl = (
      this.configService.get<string>('APP_URL') ??
      this.configService.get<string>('FRONTEND_URL') ??
      'http://localhost:3001'
    ).replace(/\/$/, '');

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(this.configService.get<string>('SMTP_PORT', '587')),
      secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${this.appUrl}/auth/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Verify your SkillShift email',
      html: `
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const forgotPasswordUrl = `${this.appUrl}/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Password reset link',
      html: `
      <p>Please click the link below to reset your password:</p>
      <a href="${forgotPasswordUrl}">Reset password</a>
      `,
    });
  }

  async sendNotificationEmail(email: string, title: string, body: string) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: title,
      html: `<p>${body}</p>`,
    });
  }
}
