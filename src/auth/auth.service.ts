import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService : PrismaService){}

  async register(registerDto : RegisterDto){
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email : registerDto.email,
      },
    });
    if(existingUser){
      throw new ConflictException("Email already registered");
    }
    const passwordHash = await bcrypt.hash(registerDto.password, 12);
    const result = await this.prismaService.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          passwordHash,
        },
      });
      await tx.profile.create({
        data: {
          userId : user.id,
          displayName : user.email.split('@')[0]
        },
      });
      await tx.wallet.create({
        data: {
          userId : user.id,
        }
      })
      return user;

    });
    return {
      id: result.id,
      email : result.email,
      role: result.role,
    };
  }
}
