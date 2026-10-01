import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('UploadController', () => {
  let controller: UploadController;
  const uploadService = { getDownloadUrl: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        { provide: UploadService, useValue: uploadService },
        {
          provide: ConfigService,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uses the authenticated identity and role for download authorization', async () => {
    await controller.getDownloadUrl('deliveries/order-1/file.pdf', {
      user: { sub: 'client-1', role: 'CLIENT' },
    } as never);

    expect(uploadService.getDownloadUrl).toHaveBeenCalledWith(
      'deliveries/order-1/file.pdf',
      'client-1',
      'CLIENT',
    );
  });
});
