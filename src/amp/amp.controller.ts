import { Controller, Get, Param } from '@nestjs/common';
import { EvaluationService } from '../evaluation/evaluation.service';

@Controller('amp')
export class AmpController {

  constructor(private readonly evaluationService: EvaluationService) {}

  @Get('eval/:url')
  evaluateUrl(@Param('url') url: string): Promise<any> {
    return this.evaluationService.evaluateUrl(decodeURIComponent(url));
  }
}
