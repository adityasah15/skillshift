import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Role } from 'generated/prisma/enums';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('UploadService', () => {
  let service: UploadService;
  let send: jest.SpyInstance;
  const config = {
    getOrThrow: jest.fn().mockReturnValue('test-value'),
  };
  const prisma = {
    profile: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
    deliveryFile: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    send = jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      ContentLength: 100,
      ContentType: 'image/png',
    } as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: config,
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  afterEach(() => {
    send.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a signed URL for an authorized avatar upload', async () => {
    jest.mocked(getSignedUrl).mockResolvedValue('https://signed.example/file');

    await expect(
      service.generatePresignedUrl(
        'avatar',
        'user-1',
        'user-1',
        'portrait.png',
        'image/png',
        100,
      ),
    ).resolves.toEqual({
      url: 'https://signed.example/file',
      key: 'avatars/user-1/portrait.png',
      expiresIn: 300,
    });

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'test-value',
          Key: 'avatars/user-1/portrait.png',
          ContentType: 'image/png',
          ContentLength: 100,
        }) as unknown,
      }),
      { expiresIn: 300 },
    );
  });

  it.each([
    ['', 'image/png', 100],
    ['../portrait.png', 'image/png', 100],
    ['folder/portrait.png', 'image/png', 100],
    ['portrait.png', 'text/plain', 100],
    ['portrait.png', 'image/png', 0],
    ['portrait.png', 'image/png', 5 * 1024 * 1024 + 1],
  ])('rejects invalid upload input %j', async (fileName, contentType, size) => {
    await expect(
      service.generatePresignedUrl(
        'avatar',
        'user-1',
        'user-1',
        fileName,
        contentType,
        size,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an avatar upload for a different user', async () => {
    await expect(
      service.generatePresignedUrl(
        'avatar',
        'user-1',
        'user-2',
        'portrait.png',
        'image/png',
        100,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects unsupported upload resources', async () => {
    await expect(
      service.generatePresignedUrl(
        'unknown',
        'resource-1',
        'user-1',
        'file.png',
        'image/png',
        100,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('confirms an avatar and saves its key to the profile', async () => {
    prisma.profile.update.mockResolvedValue({});

    await expect(
      service.confirmUpload(
        'avatar',
        'user-1',
        'user-1',
        'avatars/user-1/portrait.png',
      ),
    ).resolves.toEqual({
      key: 'avatars/user-1/portrait.png',
      size: 100,
      contentType: 'image/png',
      confirmed: true,
    });

    expect(prisma.profile.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { avatarUrl: 'avatars/user-1/portrait.png' },
    });
  });

  it('appends a confirmed portfolio image to the profile', async () => {
    prisma.profile.findUnique.mockResolvedValue({ portfolioUrls: ['old.png'] });

    await service.confirmUpload(
      'portfolio',
      'user-1',
      'user-1',
      'portfolios/user-1/new.png',
    );

    expect(prisma.profile.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { portfolioUrls: ['old.png', 'portfolios/user-1/new.png'] },
    });
  });

  it('appends a confirmed image to the owned service', async () => {
    prisma.service.findUnique
      .mockResolvedValueOnce({ freelancerId: 'user-1' })
      .mockResolvedValueOnce({ imageUrls: ['old.png'] });

    await service.confirmUpload(
      'service',
      'service-1',
      'user-1',
      'services/service-1/new.png',
    );

    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: 'service-1' },
      data: { imageUrls: ['old.png', 'services/service-1/new.png'] },
    });
  });

  it('records a confirmed delivery file', async () => {
    prisma.order.findUnique
      .mockResolvedValueOnce({ freelancerId: 'user-1' })
      .mockResolvedValueOnce({ id: 'order-1' });

    await service.confirmUpload(
      'delivery',
      'order-1',
      'user-1',
      'deliveries/order-1/final.pdf',
    );

    expect(prisma.deliveryFile.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-1',
        key: 'deliveries/order-1/final.pdf',
        originalName: 'final.pdf',
        contentType: 'image/png',
        size: 100,
      },
    });
  });

  it('rejects a download request for an unregistered delivery file', async () => {
    prisma.deliveryFile.findFirst.mockResolvedValue(null);

    await expect(
      service.getDownloadUrl(
        'deliveries/order-1/final.pdf',
        'client-1',
        Role.CLIENT,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it('rejects a missing delivery file key before querying', async () => {
    await expect(
      service.getDownloadUrl(undefined, 'client-1', Role.CLIENT),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.deliveryFile.findFirst).not.toHaveBeenCalled();
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it('rejects download access for a non-participant', async () => {
    prisma.deliveryFile.findFirst.mockResolvedValue({
      key: 'deliveries/order-1/final.pdf',
      order: { clientId: 'client-1', freelancerId: 'freelancer-1' },
    });

    await expect(
      service.getDownloadUrl(
        'deliveries/order-1/final.pdf',
        'other-user',
        Role.CLIENT,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it.each([
    ['client-1', Role.CLIENT],
    ['freelancer-1', Role.FREELANCER],
    ['admin-1', Role.ADMIN],
  ])(
    'signs a delivery download for authorized user %s',
    async (userId, role) => {
      prisma.deliveryFile.findFirst.mockResolvedValue({
        key: 'deliveries/order-1/final.pdf',
        order: { clientId: 'client-1', freelancerId: 'freelancer-1' },
      });
      jest
        .mocked(getSignedUrl)
        .mockResolvedValue('https://signed.example/file');

      await expect(
        service.getDownloadUrl('deliveries/order-1/final.pdf', userId, role),
      ).resolves.toEqual({
        url: 'https://signed.example/file',
        expiresIn: 300,
      });

      expect(prisma.deliveryFile.findFirst).toHaveBeenCalledWith({
        where: { key: 'deliveries/order-1/final.pdf' },
        include: { order: true },
      });
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-value',
            Key: 'deliveries/order-1/final.pdf',
          }),
        }) as unknown,
        { expiresIn: 300 },
      );
    },
  );

  it('rejects a key that does not belong to the requested resource', async () => {
    await expect(
      service.confirmUpload(
        'avatar',
        'user-1',
        'user-1',
        'avatars/user-2/portrait.png',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(send).not.toHaveBeenCalled();
  });

  it('preserves a missing profile error when confirming a portfolio upload', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);

    await expect(
      service.confirmUpload(
        'portfolio',
        'user-1',
        'user-1',
        'portfolios/user-1/image.png',
      ),
    ).rejects.toThrow(new NotFoundException('Profile not found'));
  });

  it('converts storage verification failures into a bad request', async () => {
    send.mockRejectedValue(new Error('S3 unavailable'));

    await expect(
      service.confirmUpload(
        'avatar',
        'user-1',
        'user-1',
        'avatars/user-1/portrait.png',
      ),
    ).rejects.toThrow(
      new BadRequestException('Uploaded file could not be verified'),
    );
  });
});
