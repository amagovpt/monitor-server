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
import { TransactionAspectsService } from "./transaction-aspects.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { TransactionAspects } from "./transaction-aspects.entity";
import { Readable } from "stream";
import { Response } from "express";

@ApiBasicAuth()
@ApiTags("transaction-aspects")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("transaction-aspects")
@UseInterceptors(LoggingInterceptor)
export class TransactionAspectsController {
  constructor(private readonly transactionAspectsService: TransactionAspectsService) {}

  @ApiOperation({ summary: "Create a new transaction aspects evaluation" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("create")
  async createTransactionAspects(
    @Request() req: any,
  ): Promise<any> {
    const jsonData = req.body.jsonData;
    const transactionAspects = new TransactionAspects();

    const createSuccess = await this.transactionAspectsService.createOne(transactionAspects, jsonData);
    
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Find all transaction aspects" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<TransactionAspects>,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("all")
  async getAllTransactionAspects(): Promise<any> {
    return success(await this.transactionAspectsService.findAll());
  }
}
