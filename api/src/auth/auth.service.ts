import { randomBytes } from 'node:crypto';
import {
  Injectable,
  type OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { argon2id, hash, verify } from 'argon2';
import type { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { ApiException } from '../http/api-errors';
import type { AuthenticatedUser } from './auth.identity';
import type { LoginDto } from './login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash!: string;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await hash(randomBytes(32), { type: argon2id });
  }

  async login({
    username,
    password,
  }: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.users
      .createQueryBuilder('user')
      .select(['user.id', 'user.role'])
      .addSelect('user.passwordHash')
      .where('user.username = :username', {
        username: username.trim().toLowerCase(),
      })
      .getOne();

    const storedHash = user?.passwordHash?.startsWith('$argon2id$')
      ? user.passwordHash
      : undefined;
    const validPassword = await verify(storedHash ?? this.dummyHash, password);
    if (!user || !storedHash || !validPassword) {
      throw new ApiException(401, {
        code: 'INVALID_CREDENTIALS',
        message: 'Usuario o contraseña incorrectos.',
      });
    }

    const accessToken = await this.jwt.signAsync(
      { role: user.role },
      { subject: String(user.id) },
    );
    return { accessToken };
  }

  async me({ id, role }: AuthenticatedUser) {
    const user = await this.users.findOne({
      where: { id },
      select: { username: true },
    });
    if (!user) throw new UnauthorizedException();
    return { id, username: user.username, role };
  }
}
