import { Module } from "@nestjs/common";
import { APISeloController } from "./api-selo.controller";
import { ApiSeloService } from "./api-selo.service";

@Module({
  controllers: [APISeloController],
  providers: [ApiSeloService],
})
export class ApiSeloModule {}
