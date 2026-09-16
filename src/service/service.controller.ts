import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ServiceQueryDto } from './dto/service-query.dto';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Roles(Role.FREELANCER)
  @Post()
  async createService(
    @Req() req: { user: JwtPayload },
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return this.serviceService.create(req.user.sub, createServiceDto);
  }

  @Get()
  async findAll(@Query() query: ServiceQueryDto) {
    return this.serviceService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') serviceId: string) {
    return this.serviceService.findOne(serviceId);
  }

  @Roles(Role.FREELANCER)
  @Patch(':id')
  async update(
    @Req() req: { user: JwtPayload },
    @Body() updateServiceDto: UpdateServiceDto,
    @Param('id') serviceId: string,
  ) {
    return this.serviceService.update(
      req.user.sub,
      updateServiceDto,
      serviceId,
    );
  }
  
  @Roles(Role.FREELANCER)
  @Delete(':id')
  async deleteService(
    @Req() req: { user: JwtPayload },
    @Param('id') serviceId: string,
  ) {
    return this.serviceService.delete(req.user.sub, serviceId);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  async approveService(@Param('id') serviceId: string) {
    return this.serviceService.approve(serviceId);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/reject')
  async rejectService(@Param('id') serviceId: string) {
    return this.serviceService.reject(serviceId);
  }
}
