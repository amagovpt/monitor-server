import { Controller, Get, Post, Param, Request } from "@nestjs/common";
import { EvaluationService } from "../evaluation/evaluation.service";
import { success, accessDenied } from "../lib/response";
import { readFileSync } from "fs";
import dns from "dns";
import ipRangeCheck from "ip-range-check";
import { RateLimit } from "nestjs-rate-limiter";

const blackList = readFileSync("../black-list.txt").toString().split("\n");

@Controller("amp")
export class AmpController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @RateLimit({
    keyPrefix: "amp",
    points: 3,
    duration: 1 * 60,
    blockDuration: 1 * 60,
    customResponseSchema: () => accessDenied(),
  })
  @Get("eval/:url")
  async evaluateUrl(
    @Request() req: any,
    @Param("url") url: string
  ): Promise<any> {
    if (process.env.NAMESPACE !== undefined && process.env.REFERER) {
      if (!req.headers.referer?.startsWith(process.env.REFERER)) {
        return accessDenied();
      }
    }

    const isValid = await this.checkIfValidUrl(decodeURIComponent(url));

    if (!isValid) {
      return accessDenied();
    }

    await this.evaluationService.increaseAccessMonitorRequestCounter();

    return success(
      await this.evaluationService.evaluateUrl(decodeURIComponent(url))
    );
  }

  @Post("eval/html")
  async evaluateHtml(@Request() req: any): Promise<any> {
    await this.evaluationService.increaseAccessMonitorRequestCounter();
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
    url = url.replace("http://", "").replace("https://", "");
    return url.split("/")[0];
  }
}

function getRequestIp(): string {
  return "amp";
}
