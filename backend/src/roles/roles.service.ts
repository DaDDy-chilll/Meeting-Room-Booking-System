import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { APP_PERMISSIONS } from '../common/constants/permissions.constants';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);
  private readonly protectedRoleNames = new Set(['admin', 'owner', 'user']);

  constructor(private readonly prisma: PrismaService) {}

  listRoles() {
    return this.prisma.role
      .findMany({
        select: {
          id: true,
          name: true,
          permissions: { select: { action: true }, orderBy: { action: 'asc' } },
        },
        orderBy: { name: 'asc' },
      })
      .then((roles) =>
        roles.map((role) => ({
          id: role.id,
          name: role.name,
          permissions: role.permissions.map((permission) => permission.action),
        })),
      );
  }

  getAvailablePermissions() {
    return APP_PERMISSIONS;
  }

  async createRole(payload: CreateRoleDto) {
    this.assertValidPermissions(payload.permissions);
    this.logger.log(`Creating role=${payload.name}`);

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: { name: payload.name.toLowerCase() },
      });

      await tx.permission.createMany({
        data: payload.permissions.map((action) => ({
          roleId: role.id,
          action,
        })),
      });

      const withPermissions = await tx.role.findUnique({
        where: { id: role.id },
        select: {
          id: true,
          name: true,
          permissions: { select: { action: true }, orderBy: { action: 'asc' } },
        },
      });

      if (!withPermissions) {
        throw new NotFoundException('Role not found after creation.');
      }

      return {
        id: withPermissions.id,
        name: withPermissions.name,
        permissions: withPermissions.permissions.map(
          (permission) => permission.action,
        ),
      };
    });
  }

  async updatePermissions(roleId: string, payload: UpdateRolePermissionsDto) {
    this.assertValidPermissions(payload.permissions);
    await this.assertRoleExists(roleId);

    this.logger.log(`Updating permissions for role=${roleId}`);
    return this.prisma.$transaction(async (tx) => {
      await tx.permission.deleteMany({ where: { roleId } });
      await tx.permission.createMany({
        data: payload.permissions.map((action) => ({ roleId, action })),
      });

      const role = await tx.role.findUnique({
        where: { id: roleId },
        select: {
          id: true,
          name: true,
          permissions: { select: { action: true }, orderBy: { action: 'asc' } },
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found.');
      }

      return {
        id: role.id,
        name: role.name,
        permissions: role.permissions.map((permission) => permission.action),
      };
    });
  }

  async deleteRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, _count: { select: { users: true } } },
    });

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    if (this.protectedRoleNames.has(role.name)) {
      throw new BadRequestException(
        `The ${role.name} role is protected and cannot be deleted.`,
      );
    }

    if (role._count.users > 0) {
      throw new BadRequestException(
        'Role cannot be deleted while it is assigned to users.',
      );
    }

    this.logger.log(`Deleting role=${roleId}`);
    return this.prisma.role.delete({ where: { id: roleId } });
  }

  private assertValidPermissions(permissions: string[]): void {
    const validPermissions = new Set(APP_PERMISSIONS);
    const invalidPermission = permissions.find(
      (permission) =>
        !validPermissions.has(permission as (typeof APP_PERMISSIONS)[number]),
    );

    if (invalidPermission) {
      throw new BadRequestException(`Unknown permission: ${invalidPermission}`);
    }
  }

  private async assertRoleExists(roleId: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
    if (!role) {
      throw new NotFoundException('Role not found.');
    }
  }
}
