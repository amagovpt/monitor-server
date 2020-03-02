import { Controller, Get, Request, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EvaluationService } from './evaluation.service';
import { success } from '../lib/response';

@Controller('evaluation')
export class EvaluationController {

  constructor(private readonly evaluationService: EvaluationService) { }

  @UseGuards(AuthGuard('jwt-monitor'))
  @Get('myMonitor/:website/:url')
  async removeMyMonitorUserWebsitePages(@Request() req: any, @Param('website') website: string, @Param('url') url: string): Promise<any> {
    const userId = req.user.userId;
    url = decodeURIComponent(url);
    return success(await this.evaluationService.findMyMonitorUserWebsitePageNewestEvaluation(userId, website, url));
  }
}
