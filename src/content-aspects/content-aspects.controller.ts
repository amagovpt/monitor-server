import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Param,
  UseInterceptors,
  Res,
  Body,
  InternalServerErrorException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ContentAspectsService } from "./content-aspects.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ContentAspects } from "./content-aspects.entity";
import { Readable } from "stream";
import { Response } from "express";

@ApiBasicAuth()
@ApiTags("content-aspects")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("content-aspects")
@UseInterceptors(LoggingInterceptor)
export class ContentAspectsController {
  constructor(private readonly contentAspectsService: ContentAspectsService) {}

  @ApiOperation({ summary: "Create a new content aspects evaluation" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("create")
  async createContentAspects(
    @Request() req: any,
  ): Promise<any> {
    const jsonData = req.body.jsonData;
    const contentAspects = new ContentAspects();

    const createSuccess = await this.contentAspectsService.createOne(contentAspects, jsonData);
    
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Find all content aspects" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<ContentAspects>,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("all")
  async getAllContentAspects(): Promise<any> {
    return success(await this.contentAspectsService.findAll());
  }
}
