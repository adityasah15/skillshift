import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchServicesDto } from './dto/search-services.dto';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiBearerAuth()
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 50,
    example: 20,
  })
  @Get('services')
  async searchServices(@Query() dto: SearchServicesDto) {
    return this.searchService.searchServices(dto);
  }
}
