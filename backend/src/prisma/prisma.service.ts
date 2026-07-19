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
  private readonly runtimeDatabaseUrl: string;

  constructor() {
    const runtimeDatabaseUrl = resolveRuntimeDatabaseUrl();
    super({ datasources: { db: { url: runtimeDatabaseUrl } } });
    this.runtimeDatabaseUrl = runtimeDatabaseUrl;

    if (process.env.VERCEL === '1' && runtimeDatabaseUrl.startsWith('file:/tmp/')) {
      // In Vercel serverless, /tmp is writable while /var/task is read-only.
      Logger.log(
        `Using temporary SQLite database at ${runtimeDatabaseUrl}`,
        PrismaService.name,
      );
    }
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.ensureSqliteSchema();
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

  private async ensureSqliteSchema(): Promise<void> {
    if (!this.runtimeDatabaseUrl.startsWith('file:')) {
      return;
    }

    await this.$executeRawUnsafe('PRAGMA foreign_keys = ON;');

    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Role" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      );
    `);

    await this.$executeRawUnsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");',
    );

    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "roleId" TEXT NOT NULL,
        CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "User_roleId_idx" ON "User"("roleId");',
    );

    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Permission" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "roleId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await this.$executeRawUnsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "Permission_roleId_action_key" ON "Permission"("roleId", "action");',
    );
    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Permission_action_idx" ON "Permission"("action");',
    );

    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Booking" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "startTime" DATETIME NOT NULL,
        "endTime" DATETIME NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Booking_userId_idx" ON "Booking"("userId");',
    );
    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Booking_startTime_endTime_idx" ON "Booking"("startTime", "endTime");',
    );
  }
}

function resolveRuntimeDatabaseUrl(): string {
  const configuredUrl = process.env.DATABASE_URL?.trim();
  const isVercelServerless = process.env.VERCEL === '1';

  if (!configuredUrl) {
    return isVercelServerless ? 'file:/tmp/dev.db' : 'file:./dev.db';
  }

  if (!isVercelServerless || !configuredUrl.startsWith('file:')) {
    return configuredUrl;
  }

  const sqlitePath = configuredUrl.slice('file:'.length);
  if (sqlitePath.startsWith('/tmp/')) {
    return configuredUrl;
  }

  if (sqlitePath.startsWith('/')) {
    return configuredUrl;
  }

  const normalizedPath = sqlitePath.replace(/^\.\//, '');
  return `file:/tmp/${normalizedPath || 'dev.db'}`;
}
