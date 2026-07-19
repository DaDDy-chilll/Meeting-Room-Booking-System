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
var AuthContextMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthContextMiddleware = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthContextMiddleware = AuthContextMiddleware_1 = class AuthContextMiddleware {
    prisma;
    logger = new common_1.Logger(AuthContextMiddleware_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async use(req, _res, next) {
        const userIdHeader = req.header('x-user-id');
        const userRoleHeader = req.header('x-user-role');
        if (!userIdHeader) {
            next();
            return;
        }
        const userId = userIdHeader.trim();
        if (!userId) {
            throw new common_1.UnauthorizedException('x-user-id cannot be empty.');
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
            throw new common_1.UnauthorizedException('Invalid actor context.');
        }
        if (userRoleHeader && userRoleHeader.toLowerCase() !== user.role.name) {
            this.logger.warn(`Actor role mismatch for user ${user.id}: header=${userRoleHeader}, persisted=${user.role.name}`);
            throw new common_1.ForbiddenException('Actor role does not match persisted role.');
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
};
exports.AuthContextMiddleware = AuthContextMiddleware;
exports.AuthContextMiddleware = AuthContextMiddleware = AuthContextMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthContextMiddleware);
//# sourceMappingURL=auth-context.middleware.js.map