import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { DisputeService } from './dispute.service';

@Controller()
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post('disputes')
  async create(
    @Req() req: { user: JwtPayload },
    @Body() createDisputeDto: CreateDisputeDto,
  ) {
    return this.disputeService.create(req.user.sub, createDisputeDto);
  }

  @Roles(Role.ADMIN)
  @Get('admin/disputes')
  async findAll() {
    return this.disputeService.findAll();
  }

  @Roles(Role.ADMIN)
  @Patch('admin/disputes/:id/resolve')
  async resolve(
    @Req() req: { user: JwtPayload },
    @Param('id') disputeId: string,
    @Body() resolveDisputeDto: ResolveDisputeDto,
  ) {
    return this.disputeService.resolve(
      disputeId,
      resolveDisputeDto,
      req.user.sub,
    );
  }
}