"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const permissions_constants_1 = require("../common/constants/permissions.constants");
const DEFAULT_ROLE_IDS = {
    admin: 'role-admin',
    owner: 'role-owner',
    user: 'role-user',
};
const DEFAULT_USER_SEEDS = [
    { id: 'user-system-admin', name: 'System Admin', role: 'admin' },
    { id: 'user-room-owner', name: 'Room Owner', role: 'owner' },
    { id: 'user-standard-user', name: 'Standard User', role: 'user' },
];
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    runtimeDatabaseUrl;
    constructor() {
        const runtimeDatabaseUrl = resolveRuntimeDatabaseUrl();
        super({ datasources: { db: { url: runtimeDatabaseUrl } } });
        this.runtimeDatabaseUrl = runtimeDatabaseUrl;
        if (process.env.VERCEL === '1' && runtimeDatabaseUrl.startsWith('file:/tmp/')) {
            common_1.Logger.log(`Using temporary SQLite database at ${runtimeDatabaseUrl}`, PrismaService_1.name);
        }
    }
    async onModuleInit() {
        await this.$connect();
        await this.ensureSqliteSchema();
        await this.seedDefaultRolesAndUsers();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async seedDefaultRolesAndUsers() {
        const roleEntries = Object.entries(permissions_constants_1.DEFAULT_ROLE_PERMISSIONS);
        for (const [roleName, permissions] of roleEntries) {
            await this.ensureRole(roleName, permissions, DEFAULT_ROLE_IDS[roleName]);
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
        if (!roleMap.get('admin') || !roleMap.get('owner') || !roleMap.get('user')) {
            throw new Error('Default roles are missing and seeding cannot continue.');
        }
        for (const userSeed of DEFAULT_USER_SEEDS) {
            const roleId = roleMap.get(userSeed.role);
            if (!roleId) {
                throw new Error(`Missing role while seeding user: ${userSeed.role}`);
            }
            await this.user.upsert({
                where: { id: userSeed.id },
                update: { name: userSeed.name, roleId },
                create: { id: userSeed.id, name: userSeed.name, roleId },
            });
        }
        this.logger.log('Seeded default users for interview demo.');
    }
    async ensureRole(roleName, permissions, preferredId) {
        const existingRole = await this.role.findUnique({
            where: { name: roleName },
            select: { id: true },
        });
        const role = existingRole
            ? existingRole
            : await this.role.create({
                data: preferredId ? { id: preferredId, name: roleName } : { name: roleName },
                select: { id: true },
            });
        await this.permission.deleteMany({ where: { roleId: role.id } });
        await this.permission.createMany({
            data: permissions.map((action) => ({ roleId: role.id, action })),
        });
    }
    async ensureSqliteSchema() {
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
        await this.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");');
        await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "roleId" TEXT NOT NULL,
        CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);
        await this.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "User_roleId_idx" ON "User"("roleId");');
        await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Permission" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "roleId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
        await this.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Permission_roleId_action_key" ON "Permission"("roleId", "action");');
        await this.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Permission_action_idx" ON "Permission"("action");');
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
        await this.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Booking_userId_idx" ON "Booking"("userId");');
        await this.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Booking_startTime_endTime_idx" ON "Booking"("startTime", "endTime");');
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
function resolveRuntimeDatabaseUrl() {
    const configuredUrl = process.env.DATABASE_URL?.trim();
    const isVercelServerless = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';
    if (isVercelServerless && isProduction) {
        if (!configuredUrl) {
            throw new Error('DATABASE_URL must be set to a persistent managed database in production.');
        }
        if (configuredUrl.startsWith('file:')) {
            throw new Error('SQLite file DATABASE_URL is not supported in Vercel production. Use managed Postgres.');
        }
    }
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
//# sourceMappingURL=prisma.service.js.map