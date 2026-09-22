import {
  Body,
  Controller,
  Post,
  Req,
} from '@nestjs/common';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewService } from './review.service';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async create(
    @Req() req: { user: JwtPayload },
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewService.create(
      createReviewDto,
      req.user.sub,
    );
  }
}