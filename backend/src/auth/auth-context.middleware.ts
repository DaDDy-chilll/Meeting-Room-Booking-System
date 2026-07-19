import {
  ForbiddenException,
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthContextMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const userIdHeader = req.header('x-user-id');
    const userRoleHeader = req.header('x-user-role');

    if (!userIdHeader) {
      next();
      return;
    }

    const userId = userIdHeader.trim();
    if (!userId) {
      throw new UnauthorizedException('x-user-id cannot be empty.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        roleId: true,
        role: {
          select: {
            name: true,
            permissions: { select: { action: true } },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid actor context.');
    }

    if (userRoleHeader && userRoleHeader.toLowerCase() !== user.role.name) {
      this.logger.warn(
        `Actor role mismatch for user ${user.id}: header=${userRoleHeader}, persisted=${user.role.name}`,
      );
      throw new ForbiddenException('Actor role does not match persisted role.');
    }

    req.actor = {
      id: user.id,
      name: user.name,
      roleId: user.roleId,
      role: user.role.name,
      permissions: user.role.permissions.map((permission) => permission.action),
    };
    next();
  }
}
