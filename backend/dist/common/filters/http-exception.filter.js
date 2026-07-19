"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalHttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalHttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalHttpExceptionFilter = GlobalHttpExceptionFilter_1 = class GlobalHttpExceptionFilter {
    logger = new common_1.Logger(GlobalHttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const statusCode = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = this.getMessage(exception);
        const payload = {
            statusCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        };
        if (statusCode >= 500) {
            this.logger.error(`Unhandled error on ${request.method} ${request.url}`, exception instanceof Error ? exception.stack : undefined);
        }
        else {
            this.logger.warn(`Request failed on ${request.method} ${request.url}: ${this.toLogMessage(message)}`);
        }
        response.status(statusCode).json(payload);
    }
    getMessage(exception) {
        if (!(exception instanceof common_1.HttpException)) {
            return 'Internal server error';
        }
        const responseBody = exception.getResponse();
        if (typeof responseBody === 'string') {
            return responseBody;
        }
        if (responseBody &&
            typeof responseBody === 'object' &&
            'message' in responseBody) {
            const message = responseBody.message;
            if (typeof message === 'string' || Array.isArray(message)) {
                return message;
            }
        }
        return exception.message;
    }
    toLogMessage(message) {
        return Array.isArray(message) ? message.join('; ') : message;
    }
};
exports.GlobalHttpExceptionFilter = GlobalHttpExceptionFilter;
exports.GlobalHttpExceptionFilter = GlobalHttpExceptionFilter = GlobalHttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalHttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map