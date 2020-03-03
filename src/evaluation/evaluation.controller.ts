import { Controller, Post, Get, Request, UseGuards, Param, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EvaluationService } from './evaluation.service';
import { success } from '../lib/response';

@Controller('evaluation')
export class EvaluationController {

  constructor(
    private readonly evaluationService: EvaluationService
  ) { }

  @UseGuards(AuthGuard('jwt-monitor'))
  @Get('myMonitor/:website/:url')
  async getMyMonitorWebsitePageEvaluation(@Request() req: any, @Param('website') website: string, @Param('url') url: string): Promise<any> {
    const userId = req.user.userId;
    url = decodeURIComponent(url);
    return success(await this.evaluationService.findMyMonitorUserWebsitePageNewestEvaluation(userId, website, url));
  }

  @UseGuards(AuthGuard('jwt-monitor'))
  @Post('myMonitor/evaluate')
  async evaluateMyMonitorWebsitePage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const url = decodeURIComponent(req.body.url);
    const page = await this.evaluationService.findPageFromUrl(url);
    const isUserPage = await this.evaluationService.isPageFromUser(userId, page.PageId);
    if (isUserPage) {
      return success(await this.evaluationService.evaluatePageAndSave(page.PageId, url, '01'));
    } else {
      throw new UnauthorizedException();
    }
  }
}
