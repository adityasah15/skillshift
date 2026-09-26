import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { GeneratePresignedUrlDto } from './dto/generate-presigned-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
  ) {}

  @Post('presigned')
  async generatePresignedUrl(
    @Body() dto: GeneratePresignedUrlDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.uploadService.generatePresignedUrl(
      dto.resource,
      dto.resourceId,
      req.user.sub,
      dto.fileName,
      dto.contentType,
      dto.fileSize,
    );
  }

  @Post('confirm')
  async confirmUpload(
    @Body() dto: ConfirmUploadDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.uploadService.confirmUpload(
      dto.resource,
      dto.resourceId,
      req.user.sub,
      dto.key,
    );
  }
}