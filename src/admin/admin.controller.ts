import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'generated/prisma/client';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('analytics')
  @Roles(Role.ADMIN)
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Patch('users/:id/:action')
@Roles(Role.ADMIN)
async manageUser(
  @Param('id') id: string,
  @Param('action') action: 'disable' | 'enable',
) {
  return this.adminService.manageUser(id, action);
}

@Patch('services/:id/moderate')
@Roles(Role.ADMIN)
async moderateService(
  @Param('id') id: string,
  @Body('status') status: 'ACTIVE' | 'REJECTED',
) {
  return this.adminService.moderateService(id, status);
}
}