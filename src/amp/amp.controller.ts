import { Controller, Get, Param } from '@nestjs/common';
import { EvaluationService } from '../evaluation/evaluation.service';
import { success } from '../lib/response';

@Controller('amp')
export class AmpController {

  constructor(private readonly evaluationService: EvaluationService) {}

  @Get('eval/:url')
  async evaluateUrl(@Param('url') url: string): Promise<any> {
    return success(await this.evaluationService.evaluateUrl(decodeURIComponent(url)));
  }
}
