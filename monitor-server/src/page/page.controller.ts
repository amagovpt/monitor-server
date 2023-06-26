import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Param,
  UnauthorizedException,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PageService } from "./page.service";
import { success } from "../lib/response";
import { EvaluationService } from "../evaluation/evaluation.service";
import { LoggingInterceptor } from "src/log/log.interceptor";

@Controller("page")
@UseInterceptors(LoggingInterceptor)
export class PageController {
  constructor(
    private readonly pageService: PageService,
    private readonly evaluationService: EvaluationService
  ) {}

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("reEvaluate")
  async reEvaluatePage(@Request() req: any): Promise<any> {
    const page = decodeURIComponent(req.body.page);

    await this.evaluationService.increaseAMSObservatoryRequestCounter();

    return success(await this.pageService.addPageToEvaluate(page, "10", -1));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("observatory/total")
  async getNumberOfObservatoryEntities(): Promise<any> {
    return success(await this.pageService.findNumberOfObservatory());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("reEvaluateMulti")
  async reEvaluatePages(@Request() req: any): Promise<any> {
    const pages = decodeURIComponent(req.body.pages)?.split(",") ?? [];
    return success(await this.pageService.addPagesToEvaluate(pages, "10", -1));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/admin/evaluating")
  async getNumberOfAdminPagesBeingEvaluated(): Promise<any> {
    return success(
      await this.pageService.findAdminEvaluatingInEvaluationList()
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/admin/waiting")
  async getNumberOfAdminPagesWaitingForEvaluation(): Promise<any> {
    return success(await this.pageService.findAdminWaitingInEvaluationList());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/admin/error")
  async getNumberOfAdminPagesWithError(): Promise<any> {
    return success(await this.pageService.findAdminWithErrorInEvaluationList());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/user/evaluating")
  async getNumberOfUserPagesBeingEvaluated(): Promise<any> {
    return success(await this.pageService.findUserEvaluatingInEvaluationList());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/user/waiting")
  async getNumberOfUserPagesWaitingForEvaluation(): Promise<any> {
    return success(await this.pageService.findUserWaitingInEvaluationList());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/user/error")
  async getNumberOfUserPagesWithError(): Promise<any> {
    return success(await this.pageService.findUserWithErrorInEvaluationList());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("evaluationList/error/delete")
  async deleteAdminPagesWithError(@Request() req: any): Promise<any> {
    const pages = req.body.pages;
    return success(await this.pageService.deleteAdminPagesWithError(pages));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/error")
  async getAdminPagesWithError(): Promise<any> {
    return success(await this.pageService.getAdminPagesWithError());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all/count/:search")
  async getAdminPageCount(@Param("search") search: string): Promise<any> {
    return success(
      await this.pageService.adminCount(decodeURIComponent(search.substring(7)))
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all/:size/:page/:sort/:direction/:search")
  async getAllPages(
    @Param("size") size: string,
    @Param("page") page: string,
    @Param("sort") sort: string,
    @Param("direction") direction: string,
    @Param("search") search: string
  ): Promise<any> {
    return success(
      await this.pageService.findAll(
        parseInt(size),
        parseInt(page),
        sort.substring(5),
        direction.substring(10),
        decodeURIComponent(search.substring(7))
      )
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("myMonitor/website/:website")
  async getAllMyMonitorUserWebsitePages(
    @Request() req: any,
    @Param("website") website: string
  ): Promise<any> {
    return success(
      await this.pageService.findAllFromMyMonitorUserWebsite(
        req.user.userId,
        website
      )
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("myMonitor/create")
  async createMyMonitorUserWebsitePages(@Request() req: any): Promise<any> {
    const website = req.body.website;
    const startingUrl = req.body.startingUrl;
    const uris = JSON.parse(req.body.pages);

    return success(
      await this.pageService.createMyMonitorUserWebsitePages(
        req.user.userId,
        website,
        startingUrl,
        uris
      )
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("myMonitor/remove")
  async removeMyMonitorUserWebsitePages(@Request() req: any): Promise<any> {
    const website = req.body.website;
    const ids = JSON.parse(req.body.pagesId);
    return success(
      await this.pageService.removeMyMonitorUserWebsitePages(
        req.user.userId,
        website,
        ids
      )
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Get("studyMonitor/tag/:tag/website/:website")
  async getStudyMonitorUserTagWebsitePages(
    @Request() req: any,
    @Param("tag") tag: string,
    @Param("website") website: string
  ): Promise<any> {
    return success(
      await this.pageService.findStudyMonitorUserTagWebsitePages(
        req.user.userId,
        tag,
        website
      )
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("add")
  async addPages(@Request() req: any): Promise<any> {
    const websiteId = req.body.websiteId;
    const uris = JSON.parse(req.body.uris).map((uri: string) =>
      decodeURIComponent(uri)
    );
    const observatory = JSON.parse(req.body.observatory).map((uri: string) =>
      decodeURIComponent(uri)
    );
    return success(
      await this.pageService.addPages(websiteId, uris, observatory)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("page/evaluate")
  async evaluatePage(@Request() req: any): Promise<any> {
    const url = decodeURIComponent(req.body.url);
    const page = await this.pageService.findPageFromUrl(url);

    if (page) {
      await this.evaluationService.increaseAMSObservatoryRequestCounter();
      return success(await this.pageService.addPageToEvaluate(url, "10", -1));
    } else {
      throw new UnauthorizedException();
    }
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("myMonitor/evaluate")
  async evaluateMyMonitorWebsitePage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const url = decodeURIComponent(req.body.url);
    const page = await this.pageService.findPageFromUrl(url);
    const isUserPage = await this.pageService.isPageFromMyMonitorUser(
      userId,
      page.PageId
    );

    if (isUserPage) {
      await this.evaluationService.increaseMyMonitorRequestCounter();
      return success(
        await this.pageService.addPageToEvaluate(url, "01", userId)
      );
    } else {
      throw new UnauthorizedException();
    }
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("studyMonitor/evaluate")
  async evaluateStudyMonitorTagWebsitePage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const tag = req.body.tag;
    const website = req.body.website;
    const url = decodeURIComponent(req.body.url);
    const page = await this.pageService.findPageFromUrl(url);
    const isUserPage = await this.pageService.isPageFromStudyMonitorUser(
      userId,
      tag,
      website,
      page.PageId
    );

    if (isUserPage) {
      await this.evaluationService.increaseStudyMonitorRequestCounter();
      return success(
        await this.pageService.addPageToEvaluate(url, "00", userId, userId)
      );
    } else {
      throw new UnauthorizedException();
    }
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("studyMonitor/create")
  async createStudyMonitorUserTagWebsitePages(
    @Request() req: any
  ): Promise<any> {
    const tag = req.body.tag;
    const website = req.body.website;
    const startingUrl = req.body.startingUrl;
    const uris = JSON.parse(req.body.pages).map((page) =>
      decodeURIComponent(page)
    );
    return success(
      await this.pageService.createStudyMonitorUserTagWebsitePages(
        req.user.userId,
        tag,
        website,
        startingUrl,
        uris
      )
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("studyMonitor/remove")
  async removeStudyMonitorUserTagWebsitePages(
    @Request() req: any
  ): Promise<any> {
    const tag = req.body.tag;
    const website = req.body.website;
    const pagesId = JSON.parse(req.body.pagesId);
    return success(
      await this.pageService.removeStudyMonitorUserTagWebsitePages(
        req.user.userId,
        tag,
        website,
        pagesId
      )
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("update")
  async update(@Request() req: any): Promise<any> {
    const pageId = req.body.pageId;
    const checked = req.body.checked;
    return success(await this.pageService.update(pageId, checked));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async delete(@Request() req: any): Promise<any> {
    const pages = req.body.pages;
    return success(await this.pageService.delete(pages));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("import")
  async importPage(@Request() req: any): Promise<any> {
    const pageId = req.body.pageId;
    const username = req.body.user;
    const tag = req.body.tag;
    const website = req.body.website;

    const type = await this.pageService.findUserType(username);

    let successImport = await this.pageService.import(pageId, type);

    if (type === "studies") {
      //method to tag from selected page of studymonitor
      successImport = await this.pageService.importStudy(
        pageId,
        username,
        tag,
        website
      );
    }

    return success(successImport);
  }
}
