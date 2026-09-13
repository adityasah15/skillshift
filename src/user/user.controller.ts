import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getUser(@Req() req: { user: JwtPayload }) {
    return this.userService.findById(req.user.sub);
  }
  @Patch('me')
  async updateProfile(
    @Req() req: { user: JwtPayload },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.sub, updateProfileDto);
  }

  @Public()
  @Get(':id')
  async getPublicProfile(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }
}
