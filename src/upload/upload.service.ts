import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadService {
  private readonly s3: S3Client;

  private readonly allowedContentTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/zip',
  ];

  private readonly maxFileSize = 5 * 1024 * 1024;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
    });
  }

  async generatePresignedUrl(
    resource: string,
    resourceId: string,
    userId: string,
    fileName: string,
    contentType: string,
    fileSize: number,
  ) {
    this.validateFileName(fileName);
    this.validateFile(contentType, fileSize);

    await this.authorizeUpload(resource, resourceId, userId);

    const key = this.buildKey(resource, userId, resourceId, fileName);

    const bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    });

    const url = await getSignedUrl(this.s3, command, {
      expiresIn: 300,
    });

    return {
      url,
      key,
      expiresIn: 300,
    };
  }

  async confirmUpload(
    resource: string,
    resourceId: string,
    userId: string,
    key: string,
  ) {
    await this.authorizeUpload(resource, resourceId, userId);

    this.validateKey(resource, resourceId, userId, key);

    const bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');

    try {
      const result = await this.s3.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );

      const size = result.ContentLength ?? 0;
      const contentType = result.ContentType ?? '';

      this.validateFile(contentType, size);

      switch (resource) {
        case 'avatar':
          await this.prisma.profile.update({
            where: {
              userId: resourceId,
            },
            data: {
              avatarUrl: key,
            },
          });
          break;

        case 'portfolio': {
          const profile = await this.prisma.profile.findUnique({
            where: {
              userId: resourceId,
            },
            select: {
              portfolioUrls: true,
            },
          });

          if (!profile) {
            throw new NotFoundException('Profile not found');
          }

          await this.prisma.profile.update({
            where: {
              userId: resourceId,
            },
            data: {
              portfolioUrls: [...profile.portfolioUrls, key],
            },
          });

          break;
        }

        case 'service': {
          const service = await this.prisma.service.findUnique({
            where: {
              id: resourceId,
            },
            select: {
              imageUrls: true,
            },
          });

          if (!service) {
            throw new NotFoundException('Service not found');
          }

          await this.prisma.service.update({
            where: {
              id: resourceId,
            },
            data: {
              imageUrls: [...service.imageUrls, key],
            },
          });

          break;
        }

        case 'delivery': {
          const order = await this.prisma.order.findUnique({
            where: {
              id: resourceId,
            },
            select: {
              id: true,
            },
          });

          if (!order) {
            throw new NotFoundException('Order not found');
          }

          const fileName = key.substring(key.lastIndexOf('/') + 1);

          await this.prisma.deliveryFile.create({
            data: {
              orderId: resourceId,
              key,
              originalName: fileName,
              contentType,
              size,
            },
          });

          break;
        }

        default:
          throw new BadRequestException('Unsupported upload resource');
      }

      return {
        key,
        size,
        contentType,
        confirmed: true,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new BadRequestException('Uploaded file could not be verified');
    }
  }

  private async authorizeUpload(
    resource: string,
    resourceId: string,
    userId: string,
  ): Promise<void> {
    switch (resource) {
      case 'avatar':
      case 'portfolio': {
        if (resourceId !== userId) {
          throw new ForbiddenException('You cannot upload for this user');
        }

        return;
      }

      case 'service': {
        const service = await this.prisma.service.findUnique({
          where: {
            id: resourceId,
          },
          select: {
            freelancerId: true,
          },
        });

        if (!service) {
          throw new NotFoundException('Service not found');
        }

        if (service.freelancerId !== userId) {
          throw new ForbiddenException('You do not own this service');
        }

        return;
      }

      case 'delivery': {
        const order = await this.prisma.order.findUnique({
          where: {
            id: resourceId,
          },
          select: {
            freelancerId: true,
          },
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        if (order.freelancerId !== userId) {
          throw new ForbiddenException(
            'You cannot upload delivery files for this order',
          );
        }

        return;
      }

      default:
        throw new BadRequestException('Unsupported upload resource');
    }
  }

  private buildKey(
    resource: string,
    userId: string,
    resourceId: string,
    fileName: string,
  ): string {
    switch (resource) {
      case 'avatar':
        return `avatars/${userId}/${fileName}`;

      case 'service':
        return `services/${resourceId}/${fileName}`;

      case 'portfolio':
        return `portfolios/${userId}/${fileName}`;

      case 'delivery':
        return `deliveries/${resourceId}/${fileName}`;

      default:
        throw new BadRequestException('Unsupported upload resource');
    }
  }

  private validateKey(
    resource: string,
    resourceId: string,
    userId: string,
    key: string,
  ): void {
    const expectedPrefix = this.getExpectedPrefix(resource, resourceId, userId);
    const prefix = `${expectedPrefix}/`;

    if (!key.startsWith(prefix)) {
      throw new ForbiddenException('Invalid upload key');
    }
    const fileName = key.slice(prefix.length);

    this.validateFileName(fileName);
  }

  private getExpectedPrefix(
    resource: string,
    resourceId: string,
    userId: string,
  ): string {
    switch (resource) {
      case 'avatar':
        return `avatars/${userId}`;

      case 'portfolio':
        return `portfolios/${userId}`;

      case 'service':
        return `services/${resourceId}`;

      case 'delivery':
        return `deliveries/${resourceId}`;

      default:
        throw new BadRequestException('Unsupported upload resource');
    }
  }

  private validateFile(contentType: string, fileSize: number): void {
    if (!this.allowedContentTypes.includes(contentType)) {
      throw new BadRequestException('Unsupported file type');
    }

    if (fileSize < 1 || fileSize > this.maxFileSize) {
      throw new BadRequestException(
        'File size must be between 1 byte and 5 MB',
      );
    }
  }

  private validateFileName(fileName: string): void {
    if (
      !fileName ||
      fileName.length > 255 ||
      fileName.includes('/') ||
      fileName.includes('\\') ||
      fileName.includes('..')
    ) {
      throw new BadRequestException('Invalid file name');
    }
  }
}
