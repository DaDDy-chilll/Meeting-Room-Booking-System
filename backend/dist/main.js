"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const logger = new common_1.Logger('Bootstrap');
let cachedApp = null;
async function createApp() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: false,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.GlobalHttpExceptionFilter());
    await app.init();
    return app;
}
async function getOrCreateApp() {
    if (!cachedApp) {
        cachedApp = await createApp();
    }
    return cachedApp;
}
async function handler(req, res) {
    const app = await getOrCreateApp();
    const instance = app.getHttpAdapter().getInstance();
    instance(req, res);
}
exports.default = handler;
async function bootstrap() {
    const app = await getOrCreateApp();
    const port = Number(process.env.PORT ?? 3001);
    await app.listen(port);
    logger.log(`Backend listening on port ${port}`);
}
const isMainModule = typeof require !== 'undefined' &&
    typeof module !== 'undefined' &&
    require.main === module;
if (isMainModule) {
    void bootstrap();
}
//# sourceMappingURL=main.js.map