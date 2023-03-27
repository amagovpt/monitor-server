import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import { WebsiteService } from "./website/website.service";
import { PageService } from "./page/page.service";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(compression());
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  //await findAccessiblityStatements(app);
  const server = await app.listen(3001);
  server.setTimeout(1800000);}
async function findAccessiblityStatements(app){
  const pageService = app.get(WebsiteService);
  await pageService.findAccessiblityStatements();
  await app.listen(process.env.PORT || 3000);
}
async function deletePlicas(app){
  const pageService = app.get(PageService);
  await pageService.deletePlicas();
}
bootstrap();
