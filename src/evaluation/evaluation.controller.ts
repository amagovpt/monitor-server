import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Param,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { EvaluationService } from "./evaluation.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiBasicAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Evaluation } from "./evaluation.entity";


@ApiBasicAuth()
@ApiTags('evaluation')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("evaluation")
@UseInterceptors(LoggingInterceptor)
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @ApiOperation({ summary: 'Find number of requests done to Observatory from the start date' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("ams/counter")
  async getAMSObservatoryRequestCounter(): Promise<any> {
    return success(
      await this.evaluationService.getAMSObservatoryRequestCounter()
    );
  }

  @ApiOperation({ summary: 'Find number of requests done to My Monitor from the start date' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("mm/counter")
  async getMyMonitorRequestCounter(): Promise<any> {
    return success(await this.evaluationService.getMyMonitorRequestCounter());
  }

  @ApiOperation({ summary: 'Find number of requests done to Study Monitor from the start date' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("sm/counter")
  async getStudyMonitorRequestCounter(): Promise<any> {
    return success(
      await this.evaluationService.getStudyMonitorRequestCounter()
    );
  }

  @ApiOperation({ summary: 'Find number of requests done to Acess Monitor from the start date' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("am/counter")
  async getAccessMonitorRequestCounter(): Promise<any> {
    return success(
      await this.evaluationService.getAccessMonitorRequestCounter()
    );
  }

  @ApiOperation({ summary: 'Reset  AMS evaluation queue' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("admin/reset")
  async resetAdminEvaluationList(): Promise<any> {
    return success(await this.evaluationService.resetAdminWaitingList());
  }

  @ApiOperation({ summary: 'Delete AMS evaluation queue (including error list)' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("admin/delete")
  async deleteAdminEvaluationList(): Promise<any> {
    return success(await this.evaluationService.deleteAdminWaitingList());
  }

  @ApiOperation({ summary: 'Reset  My Monitor evaluation queue' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("mm/reset")
  async resetMMEvaluationList(): Promise<any> {
    return success(await this.evaluationService.resetMMWaitingList());
  }

  @ApiOperation({ summary: 'Delete My Monitor evaluation queue (including error list)' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("mm/delete")
  async deleteMMEvaluationList(): Promise<any> {
    return success(await this.evaluationService.deleteMMWaitingList());
  }
  @ApiOperation({ summary: 'Reset  Study Monitor evaluation queue' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("sm/reset")
  async resetSMEvaluationList(): Promise<any> {
    return success(await this.evaluationService.resetSMWaitingList());
  }

  @ApiOperation({ summary: 'Delete Study Monitor evaluation queue (including error list)' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("sm/delete")
  async deleteSMEvaluationList(): Promise<any> {
    return success(await this.evaluationService.deleteSMWaitingList());
  }

  @ApiOperation({ summary: 'Find evaluations from a specific user and website in My Monitor' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Array<Evaluation>,
  })
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

  @ApiOperation({ summary: 'Find evaluations from a specific user, website and page in My Monitor' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Array<Evaluation>,
  })
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

  @ApiOperation({ summary: 'Find evaluations from a specific user, website and tag in Study Monitor' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Array<Evaluation>,
  })
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

  @ApiOperation({ summary: 'Find evaluations from a specific user, website, tag and url in Study Monitor' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Array<Evaluation>,
  })
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

  @ApiOperation({ summary: 'Find evaluations of a specific page in AMS' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Array<Evaluation>,
  })
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

  @ApiOperation({ summary: 'Find evaluation by id in AMS' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Evaluation,
  })
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

  @ApiOperation({ summary: 'Find evaluation by type and url in AMS' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Evaluation,
  })
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

  @ApiOperation({ summary: 'Repeat evaluations from specific evaluation list ' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Evaluation,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("list/tryAgain")
  async tryAgainPageEvaluation(@Request() req: any): Promise<any> {
    return success(
      await this.evaluationService.tryAgainEvaluation(req.body.evaluationListId)
    );
  }

  @ApiOperation({ summary: 'Repeat evaluations from specific evaluation list ' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Evaluation,
  })
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
