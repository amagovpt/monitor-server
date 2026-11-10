import './tracer';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppLoggerService } from './core/app-logger/app-logger.service';
import { useContainer } from 'class-validator';
import { GlobalExceptionFilter } from './core/filters/all-exceptions.filter';
import { FieldConflictExceptionFilter } from './core/filters/conflict-execption.filter';
import { startProfiler } from './profiler';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: [`'self'`],
                styleSrc: [`'self'`, `'unsafe-inline'`],
                imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
                scriptSrc: [`'self'`, 'https:', `'unsafe-inline'`],
              },
            }
          : false,
    }),
  );

  app.getHttpAdapter().getInstance().set('query parser', 'extended');

  app.useWebSocketAdapter(new IoAdapter(app) as any);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(compression());

  const logger = await app.resolve(AppLoggerService);
  app.useLogger(logger);

  const config = new DocumentBuilder()

    .setTitle('Monitor server')
    .setDescription('The Monitor Server API description')
    .setVersion('2.0')
    .addTag('website')
    .build();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '2',
  });

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.useGlobalFilters(new GlobalExceptionFilter(logger), new FieldConflictExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(` Server is running on: http://localhost:${port}/v2`);
  console.log(` Swagger documentation: http://localhost:${port}/api`);
  if (process.env.NODE_ENV === 'development') {
    startProfiler();
  }
}
bootstrap();
