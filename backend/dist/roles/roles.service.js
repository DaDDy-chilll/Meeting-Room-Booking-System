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
var RolesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const permissions_constants_1 = require("../common/constants/permissions.constants");
const prisma_service_1 = require("../prisma/prisma.service");
let RolesService = RolesService_1 = class RolesService {
    prisma;
    logger = new common_1.Logger(RolesService_1.name);
    protectedRoleNames = new Set(['admin', 'owner', 'user']);
    constructor(prisma) {
        this.prisma = prisma;
    }
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
            .then((roles) => roles.map((role) => ({
            id: role.id,
            name: role.name,
            permissions: role.permissions.map((permission) => permission.action),
        })));
    }
    getAvailablePermissions() {
        return permissions_constants_1.APP_PERMISSIONS;
    }
    async createRole(payload) {
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
                throw new common_1.NotFoundException('Role not found after creation.');
            }
            return {
                id: withPermissions.id,
                name: withPermissions.name,
                permissions: withPermissions.permissions.map((permission) => permission.action),
            };
        });
    }
    async updatePermissions(roleId, payload) {
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
                throw new common_1.NotFoundException('Role not found.');
            }
            return {
                id: role.id,
                name: role.name,
                permissions: role.permissions.map((permission) => permission.action),
            };
        });
    }
    async deleteRole(roleId) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
            select: { id: true, name: true, _count: { select: { users: true } } },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found.');
        }
        if (this.protectedRoleNames.has(role.name)) {
            throw new common_1.BadRequestException(`The ${role.name} role is protected and cannot be deleted.`);
        }
        if (role._count.users > 0) {
            throw new common_1.BadRequestException('Role cannot be deleted while it is assigned to users.');
        }
        this.logger.log(`Deleting role=${roleId}`);
        return this.prisma.role.delete({ where: { id: roleId } });
    }
    assertValidPermissions(permissions) {
        const validPermissions = new Set(permissions_constants_1.APP_PERMISSIONS);
        const invalidPermission = permissions.find((permission) => !validPermissions.has(permission));
        if (invalidPermission) {
            throw new common_1.BadRequestException(`Unknown permission: ${invalidPermission}`);
        }
    }
    async assertRoleExists(roleId) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
            select: { id: true },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found.');
        }
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = RolesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map