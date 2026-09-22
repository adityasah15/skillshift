import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, OrderStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createReviewDto: CreateReviewDto, reviewerId: string) {
    const order = await this.prismaService.order.findUnique({
      where: {
        id: createReviewDto.orderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.clientId !== reviewerId) {
      throw new ForbiddenException(
        'Only the client who placed the order can review it',
      );
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'You can only review completed orders',
      );
    }

    const existingReview = await this.prismaService.review.findUnique({
      where: {
        orderId: order.id,
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'A review already exists for this order',
      );
    }

    const revieweeId = order.freelancerId;

    const result = await this.prismaService.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          orderId: order.id,
          serviceId: order.serviceId,
          reviewerId,
          revieweeId,
          rating: createReviewDto.rating,
          comment: createReviewDto.comment,
        },
      });

      const profile = await tx.profile.findUnique({
        where: {
          userId: revieweeId,
        },
      });

      if (!profile) {
        throw new NotFoundException('Freelancer profile not found');
      }

      const newTotalReviews = profile.totalReviews + 1;

      const newRating =
        (profile.rating * profile.totalReviews +
          createReviewDto.rating) /
        newTotalReviews;

      await tx.profile.update({
        where: {
          userId: revieweeId,
        },
        data: {
          rating: newRating,
          totalReviews: newTotalReviews,
        },
      });

      return review;
    });

    await this.notificationService.enqueue(
      revieweeId,
      NotificationType.REVIEW_RECEIVED,
      'New review received',
      `You received a new review for order ${order.id}.`,
    );

    return result;
  }
}