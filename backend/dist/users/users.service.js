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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = UsersService_1 = class UsersService {
    prisma;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    listUsers() {
        return this.prisma.user
            .findMany({
            include: {
                role: { select: { id: true, name: true } },
                _count: { select: { bookings: true } },
            },
            orderBy: { name: 'asc' },
        })
            .then((users) => users.map((user) => ({
            id: user.id,
            name: user.name,
            roleId: user.roleId,
            role: user.role.name,
            _count: user._count,
        })));
    }
    listAssignableRoles() {
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
    async createUser(payload) {
        await this.assertRoleExists(payload.roleId);
        this.logger.log(`Creating user with roleId=${payload.roleId}`);
        return this.prisma.user
            .create({
            data: payload,
            include: { role: { select: { id: true, name: true } } },
        })
            .then((user) => ({
            id: user.id,
            name: user.name,
            roleId: user.roleId,
            role: user.role.name,
        }));
    }
    async updateUserRole(id, payload) {
        await this.assertUserExists(id);
        await this.assertRoleExists(payload.roleId);
        this.logger.log(`Updating role for user=${id} roleId=${payload.roleId}`);
        return this.prisma.user
            .update({
            where: { id },
            data: { roleId: payload.roleId },
            include: { role: { select: { id: true, name: true } } },
        })
            .then((user) => ({
            id: user.id,
            name: user.name,
            roleId: user.roleId,
            role: user.role.name,
        }));
    }
    async deleteUser(id) {
        await this.assertUserExists(id);
        this.logger.log(`Deleting user=${id} with cascade bookings delete.`);
        return this.prisma.user.delete({ where: { id } });
    }
    async assertUserExists(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
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
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map