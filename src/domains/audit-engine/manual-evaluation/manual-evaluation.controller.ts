import {
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  UseInterceptors,
  Body,
  InternalServerErrorException,
} from "@nestjs/common";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { ManualEvaluationService } from "./manual-evaluation.service";
import { EvaluationAspect } from "./manual-evaluation.entity";
import { ManualEvaluationResponseDTO } from "./dto/manual-evaluation-response.dto";
import { ManualEvaluationDocs } from "./manual-evaluation.swagger";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";

@ManualEvaluationDocs.controller()
@Controller("manual-evaluation")
@UseInterceptors(LoggingInterceptor)
@Roles("monitor")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ManualEvaluationController {
  constructor(private readonly manualEvaluationService: ManualEvaluationService) {}

  @ManualEvaluationDocs.create()
  @Post(":type/create")
  async createAspectEvaluation(
    @Param("type") type: EvaluationAspect,
    @Body("jsonData") jsonData: any 
  ): Promise<boolean> {
    const createSuccess = await this.manualEvaluationService.createEvaluation(type, jsonData);

    if (!createSuccess) {
      throw new InternalServerErrorException(`Failed to create ${type} evaluation`);
    }

    return true;
  }

  @ManualEvaluationDocs.findAllByAspect()
  @Get(":type/all")
  async getAllByAspectType(@Param("type") type: EvaluationAspect): Promise<ManualEvaluationResponseDTO[]> {
    return this.manualEvaluationService.findAllByAspect(type);
  }

  @ManualEvaluationDocs.findAllByWebsite()
  @Get("website/:id")
  async getWebsiteEvaluations(@Param("id") websiteId: number): Promise<ManualEvaluationResponseDTO[]> {
    return this.manualEvaluationService.findAllByWebsite(websiteId);
  }
}
