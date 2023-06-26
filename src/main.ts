import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import { PageService } from "./page/page.service";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(compression());
  const configService = app.get(ConfigService);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  console.log(process.env);
  await app.listen(configService.get<string>('http.port') || 3000);

}
async function deletePlicas(app){
  const pageService = app.get(PageService);
  await pageService.deletePlicas();
}
bootstrap();
