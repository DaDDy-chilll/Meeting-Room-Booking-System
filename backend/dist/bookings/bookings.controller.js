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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const current_actor_decorator_1 = require("../common/decorators/current-actor.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const authenticated_guard_1 = require("../common/guards/authenticated.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const bookings_service_1 = require("./bookings.service");
let BookingsController = class BookingsController {
    bookingsService;
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    listBookings() {
        return this.bookingsService.listBookings();
    }
    createBooking(actor, payload) {
        return this.bookingsService.createBooking(actor, payload);
    }
    deleteBooking(actor, id) {
        return this.bookingsService.deleteBooking(actor, id);
    }
    groupedBookingsByUser() {
        return this.bookingsService.getBookingsGroupedByUser();
    }
    usageSummary() {
        return this.bookingsService.getUsageSummary();
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Permissions)('booking:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "listBookings", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Permissions)('booking:create'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Permissions)('booking:delete:own'),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "deleteBooking", null);
__decorate([
    (0, common_1.Get)('grouped/by-user'),
    (0, roles_decorator_1.Permissions)('booking:view:grouped'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "groupedBookingsByUser", null);
__decorate([
    (0, common_1.Get)('summary/usage'),
    (0, roles_decorator_1.Permissions)('booking:view:summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "usageSummary", null);
exports.BookingsController = BookingsController = __decorate([
    (0, common_1.UseGuards)(authenticated_guard_1.AuthenticatedGuard, roles_guard_1.PermissionsGuard),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map