import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import { ConfigService } from "@nestjs/config";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { HttpExceptionFilter } from "./lib/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(compression());
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const configService = app.get(ConfigService);


  const config = new DocumentBuilder()
    .setTitle('Monitor server')
    .setDescription('The Monitor Server API description')
    .setVersion('1.0')
    .addTag('website')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(configService.get<string>('http.port') || 3000);
}
bootstrap();
