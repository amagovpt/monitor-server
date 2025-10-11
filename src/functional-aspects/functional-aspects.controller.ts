import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Param,
  UseInterceptors,
  Res,
  InternalServerErrorException,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FunctionalAspectsService } from "./functional-aspects.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { FunctionalAspects } from "./functional-aspects.entity";
import { Readable } from "stream";
import { Response } from "express";

@ApiBasicAuth()
@ApiTags("functional-aspects")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("functional-aspects")
@UseInterceptors(LoggingInterceptor)
export class FunctionalAspectsController {
  constructor(private readonly functionalAspectsService: FunctionalAspectsService) {}

  @ApiOperation({ summary: "Create a new functional aspects evaluation" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("create")
  async createFunctionalAspects(
    @Request() req: any,
  ): Promise<any> {
    const jsonData = req.body.jsonData;
    const functionalAspects = new FunctionalAspects();

    const createSuccess = await this.functionalAspectsService.createOne(functionalAspects, jsonData);
    
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Find all functional aspects" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<FunctionalAspects>,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("all")
  async getAllFunctionalAspects(): Promise<any> {
    return success(await this.functionalAspectsService.findAll());
  }
}
