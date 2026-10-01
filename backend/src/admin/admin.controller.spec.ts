import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Role } from 'generated/prisma/enums';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires the admin role for every route', () => {
    const handlers = [
      AdminController.prototype.getAnalytics,
      AdminController.prototype.listUsers,
      AdminController.prototype.listServices,
      AdminController.prototype.listOrders,
      AdminController.prototype.manageUser,
      AdminController.prototype.moderateService,
    ];

    for (const handler of handlers) {
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([Role.ADMIN]);
    }
  });
});
