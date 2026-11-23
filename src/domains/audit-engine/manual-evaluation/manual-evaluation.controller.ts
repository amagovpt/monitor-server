import { Controller, Post, Get, Param, UseInterceptors, Body, InternalServerErrorException } from "@nestjs/common";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { ManualEvaluationService } from "./manual-evaluation.service";
import { EvaluationAspect } from "./manual-evaluation.entity";
import { ManualEvaluationResponseDTO } from "./dto/manual-evaluation-response.dto";
import { ManualEvaluationDocs } from "./manual-evaluation.swagger";
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@ManualEvaluationDocs.controller()
@Controller("manual-evaluation")
@UseInterceptors(LoggingInterceptor)
export class ManualEvaluationController {
  constructor(private readonly manualEvaluationService: ManualEvaluationService) {}

  @ManualEvaluationDocs.create()
  @Post(":type/create")
  @Protected({
    roles: [RoleSlug.MONITOR],
  })
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
  @Protected({
    roles: [RoleSlug.MONITOR],
  })
  async getAllByAspectType(@Param("type") type: EvaluationAspect): Promise<ManualEvaluationResponseDTO[]> {
    return this.manualEvaluationService.findAllByAspect(type);
  }

  @ManualEvaluationDocs.findAllByWebsite()
  @Get("website/:id")
  @Protected({
    roles: [RoleSlug.MONITOR],
  })
  async getWebsiteEvaluations(@Param("id") websiteId: number): Promise<ManualEvaluationResponseDTO[]> {
    return this.manualEvaluationService.findAllByWebsite(websiteId);
  }
}
