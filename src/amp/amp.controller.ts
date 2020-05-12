import { Controller, Get, Post, Param, Request } from '@nestjs/common';
import { EvaluationService } from '../evaluation/evaluation.service';
import { success } from '../lib/response';

@Controller('amp')
export class AmpController {

  constructor(private readonly evaluationService: EvaluationService) {}

  @Get('eval/:url')
  async evaluateUrl(@Param('url') url: string): Promise<any> {
    return success(await this.evaluationService.evaluateUrl(decodeURIComponent(url)));
  }

  @Post('eval/html')
  async evaluateHtml(@Request() req: any): Promise<any> {
    return success(await this.evaluationService.evaluateHtml(req.body.html));
  }
}
