import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import { WebsiteService } from "./website/website.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(compression());
  //await findAccessiblityStatements(app);
  const server = await app.listen(3001);
  server.setTimeout(1800000);}
async function findAccessiblityStatements(app){
  const pageService = app.get(WebsiteService);
  await pageService.findAccessiblityStatements();
}
bootstrap();
