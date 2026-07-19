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
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    constructor() {
        const runtimeDatabaseUrl = resolveRuntimeDatabaseUrl();
        super({ datasources: { db: { url: runtimeDatabaseUrl } } });
        if (process.env.VERCEL === '1' && runtimeDatabaseUrl.startsWith('file:/tmp/')) {
            common_1.Logger.log(`Using temporary SQLite database at ${runtimeDatabaseUrl}`, PrismaService_1.name);
        }
    }
    async onModuleInit() {
        await this.$connect();
        await this.seedDefaultRolesAndUsers();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async seedDefaultRolesAndUsers() {
        const roleEntries = Object.entries(permissions_constants_1.DEFAULT_ROLE_PERMISSIONS);
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
    async ensureRole(roleName, permissions) {
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
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
function resolveRuntimeDatabaseUrl() {
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
//# sourceMappingURL=prisma.service.js.map