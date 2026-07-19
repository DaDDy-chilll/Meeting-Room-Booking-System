"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpLoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let HttpLoggingInterceptor = HttpLoggingInterceptor_1 = class HttpLoggingInterceptor {
    logger = new common_1.Logger(HttpLoggingInterceptor_1.name);
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startedAt = Date.now();
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
                this.logRequest(request, response.statusCode, Date.now() - startedAt);
            },
            error: () => {
                this.logRequest(request, response.statusCode, Date.now() - startedAt);
            },
        }));
    }
    logRequest(request, statusCode, durationMs) {
        const actorId = request.actor?.id ?? 'anonymous';
        const actorRole = request.actor?.role ?? 'anonymous';
        const message = JSON.stringify({
            method: request.method,
            path: request.originalUrl,
            actorId,
            actorRole,
            statusCode,
            durationMs,
        });
        if (statusCode >= 500) {
            this.logger.error(message);
            return;
        }
        if (statusCode >= 400) {
            this.logger.warn(message);
            return;
        }
        this.logger.log(message);
    }
};
exports.HttpLoggingInterceptor = HttpLoggingInterceptor;
exports.HttpLoggingInterceptor = HttpLoggingInterceptor = HttpLoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], HttpLoggingInterceptor);
//# sourceMappingURL=http-logging.interceptor.js.map