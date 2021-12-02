import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Param,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { EvaluationService } from "./evaluation.service";
import { success } from "../lib/response";

@Controller("evaluation")
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("ams/counter")
  async getAMSObservatoryRequestCounter(): Promise<any> {
    return success(
      await this.evaluationService.getAMSObservatoryRequestCounter()
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("mm/counter")
  async getMyMonitorRequestCounter(): Promise<any> {
    return success(await this.evaluationService.getMyMonitorRequestCounter());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("sm/counter")
  async getStudyMonitorRequestCounter(): Promise<any> {
    return success(
      await this.evaluationService.getStudyMonitorRequestCounter()
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("am/counter")
  async getAccessMonitorRequestCounter(): Promise<any> {
    return success(
      await this.evaluationService.getAccessMonitorRequestCounter()
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("admin/reset")
  async resetAdminEvaluationList(): Promise<any> {
    return success(await this.evaluationService.resetAdminWaitingList());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("admin/delete")
  async deleteAdminEvaluationList(): Promise<any> {
    return success(await this.evaluationService.deleteAdminWaitingList());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("mm/reset")
  async resetMMEvaluationList(): Promise<any> {
    return success(await this.evaluationService.resetMMWaitingList());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("mm/delete")
  async deleteMMEvaluationList(): Promise<any> {
    return success(await this.evaluationService.deleteMMWaitingList());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("sm/reset")
  async resetSMEvaluationList(): Promise<any> {
    return success(await this.evaluationService.resetSMWaitingList());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("sm/delete")
  async deleteSMEvaluationList(): Promise<any> {
    return success(await this.evaluationService.deleteSMWaitingList());
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("myMonitor/website/evaluations/:website")
  async getMyMonitorWebsitePageEvaluations(
    @Request() req: any,
    @Param("website") website: string
  ): Promise<any> {
    const userId = req.user.userId;
    return success(
      await this.evaluationService.findMyMonitorUserWebsitePageEvaluations(
        userId,
        website
      )
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("myMonitor/:website/:url")
  async getMyMonitorWebsitePageEvaluation(
    @Request() req: any,
    @Param("website") website: string,
    @Param("url") url: string
  ): Promise<any> {
    const userId = req.user.userId;
    url = decodeURIComponent(url);
    return success(
      await this.evaluationService.findMyMonitorUserWebsitePageNewestEvaluation(
        userId,
        website,
        url
      )
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Get("studyMonitor/tag/:tag/website/evaluations/:website")
  async getStudyMonitorTagWebsitePageEvaluations(
    @Request() req: any,
    @Param("tag") tag: string,
    @Param("website") website: string
  ): Promise<any> {
    const userId = req.user.userId;
    return success(
      await this.evaluationService.findStudyMonitorUserTagWebsitePageEvaluations(
        userId,
        tag,
        website
      )
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Get("studyMonitor/:tag/:website/:url")
  async getStudyMonitorTagWebsitePageEvaluation(
    @Request() req: any,
    @Param("tag") tag: string,
    @Param("website") website: string,
    @Param("url") url: string
  ): Promise<any> {
    const userId = req.user.userId;
    url = decodeURIComponent(url);
    return success(
      await this.evaluationService.findStudyMonitorUserTagWebsitePageNewestEvaluation(
        userId,
        tag,
        website,
        url
      )
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":type/page/:page")
  async getListOfPageEvaluations(
    @Request() req: any,
    @Param("type") type: string,
    @Param("page") page: string
  ): Promise<any> {
    page = decodeURIComponent(page);
    return success(
      await this.evaluationService.findAllEvaluationsFromPage(type, page)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":url/:evaluationId")
  async getPageEvaluation(
    @Param("url") url: string,
    @Param("evaluationId") evaluationId: number
  ): Promise<any> {
    url = decodeURIComponent(url);
    return success(
      await this.evaluationService.findEvaluationById(url, evaluationId)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("user/:type/:url")
  async getUserPageEvaluation(
    @Param("type") type: string,
    @Param("url") url: string
  ): Promise<any> {
    url = decodeURIComponent(url);
    return success(
      await this.evaluationService.findUserPageEvaluation(url, type)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("list/tryAgain")
  async tryAgainPageEvaluation(@Request() req: any): Promise<any> {
    return success(
      await this.evaluationService.tryAgainEvaluation(req.body.evaluationListId)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("website/:website/evaluations/:sample")
  async getWebsitePageEvaluations(
    @Request() req: any,
    @Param("website") website: string,
    @Param("sample") sample: string
  ): Promise<any> {
    return success(
      await this.evaluationService.findWebsiteEvaluations(
        decodeURIComponent(website),
        sample === "true"
      )
    );
  }
}
