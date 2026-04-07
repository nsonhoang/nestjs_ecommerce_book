import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type Redis from 'ioredis';
import { REDIS } from 'src/modules/redis/redis.module';
import type { Request } from 'express';
import { createHash } from 'crypto';
import { JwtPayload, JwtUser } from './jwt-payload.interface';

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(@Inject(REDIS) private readonly redis: Redis) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
      passReqToCallback: true,
    });
  }
  private checkBlacklist = async (token?: string | null): Promise<void> => {
    if (!token) return;

    const isBlacklisted = await this.redis.exists(
      `blacklist:${hashToken(token)}`,
    );
    if (isBlacklisted) {
      this.logger.warn('Access token đã bị thu hồi'); // không log raw token
      throw new UnauthorizedException('Access token đã bị thu hồi');
    }
  };

  async validate(req: Request, payload: JwtPayload): Promise<JwtUser> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    await this.checkBlacklist(token);

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
