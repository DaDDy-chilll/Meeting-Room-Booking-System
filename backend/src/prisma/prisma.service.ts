import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_ROLE_PERMISSIONS,
  type AppPermission,
} from '../common/constants/permissions.constants';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.seedDefaultRolesAndUsers();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private async seedDefaultRolesAndUsers(): Promise<void> {
    const roleEntries = Object.entries(DEFAULT_ROLE_PERMISSIONS);
    for (const [roleName, permissions] of roleEntries) {
      await this.ensureRole(roleName, permissions);
    }

    const userCount = await this.user.count();
    if (userCount > 0) {
      return;
    }

    const roles = await this.role.findMany({
      where: { name: { in: ['admin', 'owner', 'user'] } },
      select: { id: true, name: true },
    });
    const roleMap = new Map(roles.map((role) => [role.name, role.id]));
    const adminRoleId = roleMap.get('admin');
    const ownerRoleId = roleMap.get('owner');
    const userRoleId = roleMap.get('user');

    if (!adminRoleId || !ownerRoleId || !userRoleId) {
      throw new Error('Default roles are missing and seeding cannot continue.');
    }

    await this.user.createMany({
      data: [
        { name: 'System Admin', roleId: adminRoleId },
        { name: 'Room Owner', roleId: ownerRoleId },
        { name: 'Standard User', roleId: userRoleId },
      ],
    });
    this.logger.log('Seeded default users for interview demo.');
  }

  private async ensureRole(
    roleName: string,
    permissions: readonly AppPermission[],
  ): Promise<void> {
    const role = await this.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
      select: { id: true },
    });

    await this.permission.deleteMany({ where: { roleId: role.id } });
    await this.permission.createMany({
      data: permissions.map((action) => ({ roleId: role.id, action })),
    });
  }
}
