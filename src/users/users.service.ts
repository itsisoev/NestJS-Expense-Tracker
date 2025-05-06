import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const existUser = await this.userRepository.findOne({
      where: {
        username: createUserDto.username,
      },
    });
    if (existUser) throw new BadRequestException('this username already exist');

    const user = await this.userRepository.save({
      username: createUserDto.username,
      password: await argon2.hash(createUserDto.password),
    });

    const token = this.jwtService.sign({ username: createUserDto.username });

    return { user, token };
  }

  async findUser(username: string) {
    return await this.userRepository.findOne({ where: { username } });
  }
}
