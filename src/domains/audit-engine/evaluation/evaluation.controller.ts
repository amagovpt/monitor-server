import {
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  UseInterceptors,
  Res,
  Body,
  Query,
  StreamableFile,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { LoggingInterceptor } from 'src/core/log/log.interceptor';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { EvaluationDocs } from './evaluation.swagger';
import { EvaluationQueryDTO } from './dto/request/evaluation-request.dto';
import { Response } from 'express';
import { ContextFilterGuard } from 'src/core/authorization/guards/context.guard';
import { EvaluationTriggerDTO } from './dto/evaluation-trigger.dto';
import { EvaluationDTO } from './dto/evaluation.dto';
import { Evaluation } from './entities/evaluation.entity';
import { DestructionChallengeGuard } from 'src/core/authorization/guards/destruction-challenge.guard';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@EvaluationDocs.controller()
@Controller('evaluations/')
@UseInterceptors(LoggingInterceptor)
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @EvaluationDocs.findAll()
  @UseGuards(ContextFilterGuard)
  @Get('website/:websiteId/page/:pageId')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: {
      objectType: 'website',
      action: 'can_view',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async findAllFromPage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Query() query: EvaluationQueryDTO,
  ): Promise<{ data: Evaluation[]; count: number }> {
    return await this.evaluationService.getEvaluations(websiteId, pageId, { user }, query);
  }

  @EvaluationDocs.findOne()
  @Get('website/:websiteId/page/:pageId/evaluation/:evaluationId')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: {
      objectType: 'website',
      action: 'can_view',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async findOne(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationDTO> {
    const securityContext = { user: user };
    return await this.evaluationService.getEvaluationById(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );
  }

  @EvaluationDocs.findPageEvaluationDetails()
  @Get('website/:websiteId/page/:pageId/evaluation/:evaluationId/nodes')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: {
      objectType: 'website',
      action: 'can_view',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async getPageEvaluationDetails(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const securityContext = { user: user };
    const fileStream = await this.evaluationService.getEvaluationResultJson(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );
    res.set({
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
      'Content-Disposition': 'inline',
    });

    return new StreamableFile(fileStream);
  }

  @EvaluationDocs.findPageEvaluationDetails()
  @Get('website/:websiteId/page/:pageId/evaluation/:evaluationId/html')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: {
      objectType: 'website',
      action: 'can_view',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async getPageEvaluationHtml(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const securityContext = { user: user };
    const fileStream = await this.evaluationService.getEvaluationHtml(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );
    res.set({
      'Content-Type': 'text/html',
      'Content-Encoding': 'gzip',
      'Content-Disposition': 'inline',
    });

    return new StreamableFile(fileStream);
  }

  @EvaluationDocs.uploadExternalEvaluation()
  @Post('website/:websiteId/page/:pageId/evaluation')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'website',
      action: 'can_edit',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async uploadExternalEvaluation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() data: string,
  ): Promise<void> {
    const securityContext = { user: user };
    await this.evaluationService.saveExternalEvaluation(websiteId, pageId, data, securityContext);
  }

  @EvaluationDocs.evaluate()
  @Post('')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
  })
  async evaluate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() evaluationTriggerDTO: EvaluationTriggerDTO,
  ): Promise<void> {
    const securityContext = { user: user };
    await this.evaluationService.evaluate(
      evaluationTriggerDTO.triggerType,
      evaluationTriggerDTO.targetIds ?? [],
      securityContext,
    );
  }

  @EvaluationDocs.delete()
  @Delete('website/:websiteId/page/:pageId/evaluation/:evaluationId')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: {
      objectType: 'website',
      action: 'can_manage',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async deleteEvaluation(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const securityContext = { user: user };
    await this.evaluationService.deleteEvaluation(websiteId, pageId, evaluationId, securityContext);
  }

  @EvaluationDocs.deleteFrozen()
  @UseGuards(DestructionChallengeGuard)
  @Delete('website/:websiteId/page/:pageId/evaluation/:evaluationId/frozen/:challengeKey')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'website',
      action: 'can_manage',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async deleteFrozenEvaluation(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Param('challengeKey') challengeKey: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const securityContext = { user: user };

    await this.evaluationService.deleteEvaluation(websiteId, pageId, evaluationId, securityContext);
  }
}
