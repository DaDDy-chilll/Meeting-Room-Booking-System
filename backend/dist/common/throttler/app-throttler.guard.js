"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppThrottlerGuard = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
let AppThrottlerGuard = class AppThrottlerGuard extends throttler_1.ThrottlerGuard {
    getTracker(req) {
        const actor = req.actor;
        const ips = req.ips;
        const socket = req.socket;
        const actorId = actor?.id ?? 'anonymous';
        const ipAddress = (typeof req.ip === 'string' ? req.ip : undefined) ??
            (Array.isArray(ips) && typeof ips[0] === 'string' ? ips[0] : undefined) ??
            socket?.remoteAddress ??
            'unknown';
        return Promise.resolve(`${ipAddress}:${actorId}`);
    }
};
exports.AppThrottlerGuard = AppThrottlerGuard;
exports.AppThrottlerGuard = AppThrottlerGuard = __decorate([
    (0, common_1.Injectable)()
], AppThrottlerGuard);
//# sourceMappingURL=app-throttler.guard.js.map