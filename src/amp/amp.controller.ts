import { Controller, Get, Post, Param, Request, InternalServerErrorException } from '@nestjs/common';
import { EvaluationService } from '../evaluation/evaluation.service';
import { success } from '../lib/response';
import { readFileSync } from 'fs';
import dns from 'dns';
import ipRangeCheck from 'ip-range-check';

const blackList = readFileSync('../black-list.txt').toString().split('\n');

@Controller('amp')
export class AmpController {

  constructor(private readonly evaluationService: EvaluationService) {}

  @Get('eval/:url')
  async evaluateUrl(@Param('url') url: string): Promise<any> {
    const isValid = await this.checkIfValidUrl(decodeURIComponent(url));

    if (!isValid) {
       throw new InternalServerErrorException();
    }

    return success(await this.evaluationService.evaluateUrl(decodeURIComponent(url)));
  }

  @Post('eval/html')
  async evaluateHtml(@Request() req: any): Promise<any> {
    return success(await this.evaluationService.evaluateHtml(req.body.html));
  }

  private checkIfValidUrl(url: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      dns.lookup(this.fixUrl(url), (err: any, addr: any) => {
        const isValid = !ipRangeCheck(addr, blackList);
        resolve(isValid);
      });
    });
  } 
  
  private fixUrl(url: string): string {
    url = url.replace('http://', '').replace('https://', '');
    return url.split('/')[0];
  }
}
