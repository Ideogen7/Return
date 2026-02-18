import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { DeleteAccountDto } from './dto/delete-account.dto.js';
import {
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '../common/exceptions/problem-details.exception.js';
import type { SafeUser } from '../auth/interfaces/auth-response.interface.js';
import type { User } from '@prisma/client';

// =============================================================================
// Retour spécifique pour les endpoints Settings
// =============================================================================

export interface UserSettings {
  pushNotificationsEnabled: boolean;
  reminderEnabled: boolean;
  language: string;
  timezone: string;
}

// =============================================================================
// UsersService — Gestion du profil et des préférences utilisateur
// =============================================================================
// Responsabilités (SRP) :
//   - Lecture/mise à jour du profil (GET/PATCH /users/me)
//   - Suppression de compte (DELETE /users/me)
//   - Changement de mot de passe (PATCH /users/me/password)
//   - Lecture/mise à jour des préférences (GET/PATCH /users/me/settings)
//
// Sécurité :
//   - Le userId vient toujours du JWT (req.user.userId), jamais du body
//   - Suppression et changement de mot de passe requièrent le mot de passe actuel
//   - Suppression de compte = Prisma onDelete: Cascade (supprime aussi les refresh tokens)
// =============================================================================

@Injectable()
export class UsersService {
  private readonly BCRYPT_ROUNDS = 12;
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // PROFIL
  // ===========================================================================

  /**
   * GET /users/me — Retourne le profil de l'utilisateur authentifié.
   *
   * @throws NotFoundException (404) si l'utilisateur n'existe plus
   */
  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.findUserOrThrow(userId);
    return this.sanitizeUser(user);
  }

  /**
   * PATCH /users/me — Met à jour partiellement le profil.
   *
   * Les champs absents du DTO ne sont pas modifiés (PATCH sémantique).
   * L'email peut être mis à jour, mais doit rester unique.
   *
   * @throws ConflictException (409) si l'email est déjà pris
   */
  async updateProfile(userId: string, dto: UpdateUserDto): Promise<SafeUser> {
    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: dto,
      });
      return this.sanitizeUser(updated);
    } catch (error: unknown) {
      if (this.isPrismaUniqueError(error)) {
        throw new ConflictException(
          'email-already-exists',
          'This email address is already associated with another account.',
          '/v1/users/me',
        );
      }
      throw error;
    }
  }

  /**
   * DELETE /users/me — Supprime définitivement le compte utilisateur.
   *
   * Sécurité renforcée :
   * 1. Vérifie le mot de passe actuel (bcrypt.compare)
   * 2. Vérifie le texte de confirmation ("DELETE MY ACCOUNT")
   *    → La validation @Equals est dans le DTO, mais on double-check ici
   *
   * La suppression cascade sur les refresh tokens (Prisma onDelete: Cascade).
   *
   * @throws NotFoundException (404) si l'utilisateur n'existe plus
   * @throws UnauthorizedException (401) si le mot de passe est incorrect
   */
  async deleteAccount(userId: string, dto: DeleteAccountDto): Promise<void> {
    const user = await this.findUserOrThrow(userId);

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'invalid-password',
        'The provided password is incorrect.',
        '/v1/users/me',
      );
    }

    // Suppression (cascade → refresh tokens supprimés automatiquement)
    await this.prisma.user.delete({ where: { id: userId } });

    this.logger.log(`Account deleted: ${userId}`);
  }

  // ===========================================================================
  // MOT DE PASSE
  // ===========================================================================

  /**
   * PATCH /users/me/password — Change le mot de passe.
   *
   * 1. Vérifie l'ancien mot de passe (bcrypt.compare)
   * 2. Hache le nouveau mot de passe (bcrypt, 12 rounds)
   * 3. Met à jour en base
   *
   * @throws NotFoundException (404) si l'utilisateur n'existe plus
   * @throws UnauthorizedException (401) si l'ancien mot de passe est incorrect
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findUserOrThrow(userId);

    // Vérification de l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'invalid-password',
        'The current password is incorrect.',
        '/v1/users/me/password',
      );
    }

    // Hachage et mise à jour
    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      this.BCRYPT_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password changed for user: ${userId}`);
  }

  // ===========================================================================
  // PRÉFÉRENCES (SETTINGS)
  // ===========================================================================

  /**
   * GET /users/me/settings — Retourne les préférences utilisateur.
   *
   * @throws NotFoundException (404) si l'utilisateur n'existe plus
   */
  async getSettings(userId: string): Promise<UserSettings> {
    const user = await this.findUserOrThrow(userId);
    return this.extractSettings(user);
  }

  /**
   * PATCH /users/me/settings — Met à jour les préférences.
   *
   * Les champs absents du DTO ne sont pas modifiés (PATCH sémantique).
   */
  async updateSettings(
    userId: string,
    dto: UpdateSettingsDto,
  ): Promise<UserSettings> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return this.extractSettings(updated);
  }

  // ===========================================================================
  // PRIVATE — Helpers
  // ===========================================================================

  /**
   * Recherche un utilisateur par ID ou lève NotFoundException.
   */
  private async findUserOrThrow(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User', userId, '/v1/users/me');
    }

    return user;
  }

  /**
   * Retire le password de l'objet User (SafeUser).
   */
  private sanitizeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  /**
   * Extrait les champs de préférences d'un User.
   */
  private extractSettings(user: User): UserSettings {
    return {
      pushNotificationsEnabled: user.pushNotificationsEnabled,
      reminderEnabled: user.reminderEnabled,
      language: user.language,
      timezone: user.timezone,
    };
  }

  /**
   * Vérifie si une erreur Prisma est une violation unique (P2002).
   */
  private isPrismaUniqueError(
    error: unknown,
  ): error is Error & { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    );
  }
}
