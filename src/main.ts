import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import { PageService } from "./page/page.service";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(compression());
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = new DocumentBuilder()
    .setTitle('Monitor server')
    .setDescription('The Monitor Server API description')
    .setVersion('1.0')
    .addTag('a11y')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT || 3000);
}
async function deletePlicas(app){
  const pageService = app.get(PageService);
  await pageService.deletePlicas();
}
bootstrap();
