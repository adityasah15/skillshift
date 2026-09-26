import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchServicesDto } from './dto/search-services.dto';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
  ) {}

  @Get('services')
  async searchServices(
    @Query() dto: SearchServicesDto,
  ) {
    return this.searchService.searchServices(dto);
  }
}