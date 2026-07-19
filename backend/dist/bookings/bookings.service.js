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
var BookingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingsService = BookingsService_1 = class BookingsService {
    prisma;
    logger = new common_1.Logger(BookingsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    listBookings() {
        return this.prisma.booking
            .findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        roleId: true,
                        role: { select: { name: true } },
                    },
                },
            },
            orderBy: [{ startTime: 'asc' }, { createdAt: 'asc' }],
        })
            .then((bookings) => bookings.map((booking) => ({
            ...booking,
            user: {
                id: booking.user.id,
                name: booking.user.name,
                roleId: booking.user.roleId,
                role: booking.user.role.name,
                permissions: [],
            },
        })));
    }
    transformBooking(booking) {
        return {
            ...booking,
            user: {
                id: booking.user.id,
                name: booking.user.name,
                roleId: booking.user.roleId,
                role: booking.user.role.name,
                permissions: [],
            },
        };
    }
    async loadBookingWithUser(tx, bookingId) {
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        roleId: true,
                        role: { select: { name: true } },
                    },
                },
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found.');
        }
        return this.transformBooking(booking);
    }
    async createBooking(actor, payload) {
        const startTime = new Date(payload.startTime);
        const endTime = new Date(payload.endTime);
        if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
            throw new common_1.BadRequestException('Invalid datetime format. Use ISO 8601 UTC.');
        }
        if (startTime >= endTime) {
            throw new common_1.BadRequestException('startTime must be before endTime.');
        }
        this.logger.log(`Creating booking requested by actor=${actor.id} from=${startTime.toISOString()} to=${endTime.toISOString()}`);
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: actor.id },
                select: { id: true },
            });
            if (!user) {
                throw new common_1.NotFoundException('Actor user no longer exists.');
            }
            const overlap = await tx.booking.findFirst({
                where: {
                    startTime: { lt: endTime },
                    endTime: { gt: startTime },
                },
                select: { id: true, startTime: true, endTime: true },
            });
            if (overlap) {
                this.logger.warn(`Booking overlap conflict actor=${actor.id} conflictBooking=${overlap.id}`);
                throw new common_1.ConflictException('Booking overlap detected.');
            }
            const created = await tx.booking.create({
                data: {
                    userId: actor.id,
                    startTime,
                    endTime,
                },
            });
            return this.loadBookingWithUser(tx, created.id);
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async deleteBooking(actor, bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            select: { id: true, userId: true },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found.');
        }
        const canDeleteAny = actor.permissions.includes('booking:delete:any');
        if (!canDeleteAny && booking.userId !== actor.id) {
            throw new common_1.ForbiddenException('Users can only delete their own bookings.');
        }
        this.logger.log(`Deleting booking=${bookingId} by actor=${actor.id}`);
        return this.prisma.booking.delete({ where: { id: bookingId } });
    }
    async getBookingsGroupedByUser() {
        const bookings = await this.prisma.booking.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        roleId: true,
                        role: { select: { name: true } },
                    },
                },
            },
            orderBy: [{ userId: 'asc' }, { startTime: 'asc' }],
        });
        const grouped = new Map();
        for (const rawBooking of bookings) {
            const booking = this.transformBooking(rawBooking);
            const current = grouped.get(booking.userId);
            if (current) {
                current.bookings.push(booking);
                continue;
            }
            grouped.set(booking.userId, {
                user: booking.user,
                bookings: [booking],
            });
        }
        return Array.from(grouped.values());
    }
    async getUsageSummary() {
        const grouped = await this.prisma.booking.groupBy({
            by: ['userId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });
        const users = await this.prisma.user.findMany({
            where: { id: { in: grouped.map((item) => item.userId) } },
            select: {
                id: true,
                name: true,
                roleId: true,
                role: { select: { name: true } },
            },
        });
        const userMap = new Map(users.map((user) => [
            user.id,
            {
                id: user.id,
                name: user.name,
                roleId: user.roleId,
                role: user.role.name,
                permissions: [],
            },
        ]));
        return grouped.map((item) => ({
            user: userMap.get(item.userId) ?? null,
            totalBookings: item._count.id,
        }));
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = BookingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map