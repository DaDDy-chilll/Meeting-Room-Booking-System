import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from '../constants/auth.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const actor = request.actor;

    if (!actor) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const actorPermissions = new Set(actor.permissions);
    const missingPermission = requiredPermissions.find(
      (permission) => !actorPermissions.has(permission),
    );

    if (missingPermission) {
      throw new ForbiddenException(
        `Insufficient permission: ${missingPermission}.`,
      );
    }

    return true;
  }
}
