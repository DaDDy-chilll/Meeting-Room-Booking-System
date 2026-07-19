import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const defaultCorsOrigins = [
    'http://localhost:3000',
    'https://meeting-room-booking-system-fwqg.vercel.app',
  ];

  app.use(helmet());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? defaultCorsOrigins.join(','))
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
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

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`Backend listening on port ${port}`);
}

void bootstrap();
