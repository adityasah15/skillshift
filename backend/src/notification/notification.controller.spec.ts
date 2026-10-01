import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  const notificationService = {
    listForUser: jest.fn(),
    unreadCount: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('delegates list and unread count using the authenticated user id', async () => {
    const request = { user: { sub: 'user-1' } };

    await controller.list(request as never);
    await controller.unreadCount(request as never);

    expect(notificationService.listForUser).toHaveBeenCalledWith('user-1');
    expect(notificationService.unreadCount).toHaveBeenCalledWith('user-1');
  });

  it('delegates read operations using the authenticated user id', async () => {
    const request = { user: { sub: 'user-1' } };

    await controller.markRead(request as never, 'notification-1');
    await controller.markAllRead(request as never);

    expect(notificationService.markRead).toHaveBeenCalledWith(
      'user-1',
      'notification-1',
    );
    expect(notificationService.markAllRead).toHaveBeenCalledWith('user-1');
  });
});