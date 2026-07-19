import { Logger, ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

const logger = new Logger('Bootstrap');
let cachedApp: INestApplication | null = null;

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: false,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  await app.init();
  return app;
}

async function getOrCreateApp(): Promise<INestApplication> {
  if (!cachedApp) {
    cachedApp = await createApp();
  }

  return cachedApp;
}

export async function handler(req: Request, res: Response): Promise<void> {
  const app = await getOrCreateApp();
  const instance = app.getHttpAdapter().getInstance() as unknown as (
    req: Request,
    res: Response,
  ) => void;
  instance(req, res);
}

export default handler;

async function bootstrap() {
  const app = await getOrCreateApp();
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`Backend listening on port ${port}`);
}

const isMainModule =
  typeof require !== 'undefined' &&
  typeof module !== 'undefined' &&
  require.main === module;

if (isMainModule) {
  void bootstrap();
}
