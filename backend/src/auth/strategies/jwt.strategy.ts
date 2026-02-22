import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../../redis/redis.service.js';
import { UnauthorizedException } from '../../common/exceptions/problem-details.exception.js';

/**
 * Payload du JWT access token.
 *
 * - `sub` : ID utilisateur (UUID)
 * - `email` : Email de l'utilisateur
 * - `role` : Rôle de l'utilisateur (LENDER/BORROWER) — évite un appel DB
 * - `jti` : JWT ID unique — utilisé pour la blacklist Redis
 * - `iat` / `exp` : Timestamps auto-générés par jsonwebtoken
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  iat?: number;
  exp?: number;
}

/**
 * Objet attaché à `req.user` après validation du JWT par Passport.
 *
 * Contient le jti et exp originaux pour permettre au controller
 * de les transmettre à AuthService.logout() lors de la déconnexion.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  jti: string;
  tokenExp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Validation du JWT après vérification de la signature par Passport.
   *
   * Vérifie en plus que le token n'a pas été blacklisté via son `jti`.
   * Un token blacklisté = utilisateur déconnecté = accès refusé.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Vérification de la blacklist Redis (logout révoque le jti)
    const isBlacklisted = await this.redis.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      throw new UnauthorizedException('token-revoked', 'This token has been revoked.', '');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
      tokenExp: payload.exp ?? 0,
    };
  }
}
