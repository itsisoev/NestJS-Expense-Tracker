import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from '../users/users.interface';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findUser(username);
    const passwordIsMatch = await argon2.verify(user.password, password);

    if (user && passwordIsMatch) {
      return user;
    }

    throw new UnauthorizedException();
  }

  async login(user: IUser) {
    const { id, username } = user;

    return {
      id,
      username,
      token: this.jwtService.sign({ id: user.id, username: user.username }),
    };
  }
}
