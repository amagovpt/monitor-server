import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Param,
  UnauthorizedException,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PageService } from "./page.service";
import { success } from "../lib/response";
import { EvaluationService } from "../evaluation/evaluation.service";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiTags,
  ApiResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { PageUrlDto } from "./dto/page-url.dto";
import { PageListDto } from "./dto/page-list.dto";
import { CreatePageMyMonitorDto } from "./dto/create-page-my-monitor.dto";
import { DeletePageMyMonitorDto } from "./dto/delete-page-my-monitor.dto";
import { Page } from "./page.entity";
import { PageEvaluateDto } from "./dto/page-evaluate.dto";
import { PageEvaluateStudyMonitorDto } from "./dto/page-evaluate-study-monitor.dto";
import { PageCreateStudyMonitorDto } from "./dto/page-create-study-monitor.dto";
import { PageDeleteStudyMonitorDto } from "./dto/page-delete-study-monitor.dto";
import { PageUpdateDto } from "./dto/page-update.dto";
import { PageDeleteDto } from "./dto/page-delete.dto";
import { PageImportDto } from "./dto/page-import.dto";

@ApiBasicAuth()
@ApiTags("page")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("page")
@UseInterceptors(LoggingInterceptor)
export class PageController {
  constructor(
    private readonly pageService: PageService,
    private readonly evaluationService: EvaluationService
  ) {}

  @ApiOperation({ summary: "Reevaluate page" })
  @ApiResponse({
    status: 200,
    description: "The evaluation request has been submited",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("reEvaluate")
  async reEvaluatePage(@Body() pageUrlDto: PageUrlDto): Promise<any> {
    const page = decodeURIComponent(pageUrlDto.page);

    await this.evaluationService.increaseAMSObservatoryRequestCounter();

    return success(await this.pageService.addPageToEvaluate(page, "10", -1));
  }

  @ApiOperation({ summary: "Find the number of pages in observatory" })
  @ApiResponse({
    status: 200,
    description: "The number of pages in observatory",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("observatory/total")
  async getNumberOfObservatoryPages(): Promise<any> {
    return success(await this.pageService.findNumberOfObservatory());
  }

  @ApiOperation({ summary: "Find number of pages in MyMonitor" })
  @ApiResponse({
    status: 200,
    description: "The number of pages in MyMonitor",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("myMonitor/total")
  async getNumberOfMyMonitorPages(): Promise<any> {
    return success(await this.pageService.findNumberOfMyMonitor());
  }

  @ApiOperation({ summary: "Reevaluate multiple pages by url" })
  @ApiResponse({
    status: 200,
    description: "The evaluation request has been submited",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("reEvaluateMulti")
  async reEvaluatePages(@Request() req: any): Promise<any> {
    const pages = decodeURIComponent(req.body.pages)?.split(",") ?? [];
    return success(await this.pageService.addPagesToEvaluate(pages, "10", -1));
  }

  @ApiOperation({
    summary: "Find the number of pages being evaluated by the admin",
  })
  @ApiResponse({
    status: 200,
    description: "The number of pages being evaluated",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/admin/evaluating")
  async getNumberOfAdminPagesBeingEvaluated(): Promise<any> {
    return success(
      await this.pageService.findAdminEvaluatingInEvaluationList()
    );
  }

  @ApiOperation({
    summary: "Find the number of pages waiting for evaluation by the admin",
  })
  @ApiResponse({
    status: 200,
    description: "The number of pages waiting",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/admin/waiting")
  async getNumberOfAdminPagesWaitingForEvaluation(): Promise<any> {
    return success(await this.pageService.findAdminWaitingInEvaluationList());
  }

  @ApiOperation({
    summary: "Find the number of pages that failed the evaluation by the admin",
  })
  @ApiResponse({
    status: 200,
    description: "The number of pages that failed the evaluation",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/admin/error")
  async getNumberOfAdminPagesWithError(): Promise<any> {
    return success(await this.pageService.findAdminWithErrorInEvaluationList());
  }

  @ApiOperation({
    summary: "Find the number of pages being evaluated by the user",
  })
  @ApiResponse({
    status: 200,
    description: "The number of pages being evaluated",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/user/evaluating")
  async getNumberOfUserPagesBeingEvaluated(): Promise<any> {
    return success(await this.pageService.findUserEvaluatingInEvaluationList());
  }

  @ApiOperation({
    summary: "Find the number of pages waiting for evaluation by the user",
  })
  @ApiResponse({
    status: 200,
    description: "The number of pages waiting",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/user/waiting")
  async getNumberOfUserPagesWaitingForEvaluation(): Promise<any> {
    return success(await this.pageService.findUserWaitingInEvaluationList());
  }

  @ApiOperation({
    summary: "Find the number of pages that failed the evaluation by the user",
  })
  @ApiResponse({
    status: 200,
    description: "The number of pages that failed the evaluation",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/user/error")
  async getNumberOfUserPagesWithError(): Promise<any> {
    return success(await this.pageService.findUserWithErrorInEvaluationList());
  }

  @ApiOperation({ summary: "Delete pages from evaluation list" })
  @ApiResponse({
    status: 200,
    description:
      "The selected pages have been deleted from the evaluation list",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("evaluationList/error/delete")
  async deleteAdminPagesWithError(
    @Body() pageListDto: PageListDto
  ): Promise<any> {
    const pages = pageListDto.pages;
    return success(await this.pageService.deleteAdminPagesWithError(pages));
  }

  @ApiOperation({ summary: "Find pages with evaluation errors" })
  @ApiResponse({
    status: 200,
    description: "List of a pages with evaluation errors",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("evaluationList/error")
  async getAdminPagesWithError(): Promise<any> {
    return success(await this.pageService.getAdminPagesWithError());
  }

  @ApiOperation({ summary: "Find number of pages by search term" })
  @ApiResponse({
    status: 200,
    description: "Number of pages",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all/count/:search")
  async getAdminPageCount(@Param("search") search: string): Promise<any> {
    return success(
      await this.pageService.adminCount(decodeURIComponent(search.substring(7)))
    );
  }
  @ApiOperation({
    summary: "Find pages by search term, sort, direction, and size",
  })
  @ApiResponse({
    status: 200,
    description: "List of pages",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all/:size/:page/:sort/:direction/:search")
  async getAllPages(
    @Param("size") size: string,
    @Param("page") page: string,
    @Param("sort") sort: string,
    @Param("direction") direction: string,
    @Param("search") search: string
  ): Promise<any> {
    console.log("pedido CHegou");
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
  @ApiOperation({
    summary: "Find all pages from a specific website in MyMonitor",
  })
  @ApiResponse({
    status: 200,
    description: "List of pages",
    type: Number,
  })
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

  @ApiOperation({ summary: "Add a page to a website in MyMonitor" })
  @ApiResponse({
    status: 200,
    description: "Page added with success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("myMonitor/create")
  async createMyMonitorUserWebsitePages(
    @Request() req: any,
    @Body() pageMyMonitorDto: CreatePageMyMonitorDto
  ): Promise<any> {
    const website = pageMyMonitorDto.website;
    const startingUrl = pageMyMonitorDto.startingUrl;
    const uris = pageMyMonitorDto.pages;

    return success(
      await this.pageService.createMyMonitorUserWebsitePages(
        req.user.userId,
        website,
        startingUrl,
        uris
      )
    );
  }

  @ApiOperation({ summary: "Delete a page in a website in MyMonitor" })
  @ApiResponse({
    status: 200,
    description: "Page deleted with success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("myMonitor/remove")
  async removeMyMonitorUserWebsitePages(
    @Request() req: any,
    @Body() deletePageMyMonitorDto: DeletePageMyMonitorDto
  ): Promise<any> {
    const website = deletePageMyMonitorDto.website;
    const ids = deletePageMyMonitorDto.pagesId;
    return success(
      await this.pageService.removeMyMonitorUserWebsitePages(
        req.user.userId,
        website,
        ids
      )
    );
  }

  @ApiOperation({
    summary: "Find pages by tag, website and user in Study Monitor",
  })
  @ApiResponse({
    status: 200,
    description: "List of pages",
    type: Array<Page>,
  })
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

  @ApiOperation({
    summary: "Find pages by tag, website and user in Study Monitor",
  })
  @ApiResponse({
    status: 200,
    description: "List of pages",
    type: Boolean,
  })
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

  @ApiOperation({ summary: "Evaluate page" })
  @ApiResponse({
    status: 200,
    description: "Evaluation added to evaluation queue",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("page/evaluate")
  async evaluatePage(@Body() pageEvaluateDto: PageEvaluateDto): Promise<any> {
    const url = decodeURIComponent(pageEvaluateDto.url);
    const page = await this.pageService.findPageFromUrl(url);

    if (page) {
      await this.evaluationService.increaseAMSObservatoryRequestCounter();
      return success(await this.pageService.addPageToEvaluate(url, "10", -1));
    } else {
      throw new UnauthorizedException();
    }
  }

  @ApiOperation({ summary: "Evaluate page in My Monitor" })
  @ApiResponse({
    status: 200,
    description: "Evaluation added to evaluation queue",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("myMonitor/evaluate")
  async evaluateMyMonitorWebsitePage(
    @Request() req: any,
    @Body() pageEvaluateDto: PageEvaluateDto
  ): Promise<any> {
    const userId = req.user.userId;
    const url = decodeURIComponent(pageEvaluateDto.url);
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

  @ApiOperation({ summary: "Evaluate page in Study Monitor" })
  @ApiResponse({
    status: 200,
    description: "Evaluation added to evaluation queue",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Post("studyMonitor/evaluate")
  async evaluateStudyMonitorTagWebsitePage(
    @Request() req: any,
    @Body() pageEvaluateStudyMonitorDto: PageEvaluateStudyMonitorDto
  ): Promise<any> {
    const userId = req.user.userId;
    const tag = pageEvaluateStudyMonitorDto.tag;
    const website = pageEvaluateStudyMonitorDto.website;
    const url = decodeURIComponent(pageEvaluateStudyMonitorDto.url);
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

  @ApiOperation({ summary: "Create page in Study Monitor" })
  @ApiResponse({
    status: 200,
    description: "Page created",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Post("studyMonitor/create")
  async createStudyMonitorUserTagWebsitePages(
    @Request() req: any,
    pageCreateStudyMonitorDto: PageCreateStudyMonitorDto
  ): Promise<any> {
    const tag = pageCreateStudyMonitorDto.tag;
    const website = pageCreateStudyMonitorDto.website;
    const startingUrl = pageCreateStudyMonitorDto.startingUrl;
    const uris = JSON.parse(pageCreateStudyMonitorDto.pages).map((page) =>
      decodeURIComponent(page)
    ); //FIXME
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

  @ApiOperation({ summary: "Remove page in Study Monitor" })
  @ApiResponse({
    status: 200,
    description: "Page removed",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Post("studyMonitor/remove")
  async removeStudyMonitorUserTagWebsitePages(
    @Request() req: any,
    pageDeleteStudyMonitorDto: PageDeleteStudyMonitorDto
  ): Promise<any> {
    const tag = pageDeleteStudyMonitorDto.tag;
    const website = pageDeleteStudyMonitorDto.website;
    const pagesId = pageDeleteStudyMonitorDto.pagesId;
    return success(
      await this.pageService.removeStudyMonitorUserTagWebsitePages(
        req.user.userId,
        tag,
        website,
        pagesId
      )
    );
  }

  @ApiOperation({ summary: "Update page in Study Monitor" })
  @ApiResponse({
    status: 200,
    description: "Page updated",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("update")
  async update(@Body() pageUpdateDto: PageUpdateDto): Promise<any> {
    const pageId = pageUpdateDto.pageId;
    const checked = pageUpdateDto.checked;
    return success(await this.pageService.update(pageId, checked));
  }

  @ApiOperation({ summary: "Delete page" })
  @ApiResponse({
    status: 200,
    description: "Page deleted",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async delete(@Body() pageDeleteDto: PageDeleteDto): Promise<any> {
    const pages = pageDeleteDto.pages;
    return success(await this.pageService.delete(pages));
  }

  @ApiOperation({
    summary: "Import page from a my monitor or study monitor user",
  })
  @ApiResponse({
    status: 200,
    description: "Page imported",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("import")
  async importPage(@Body() pageImportDto: PageImportDto): Promise<any> {
    const pageId = pageImportDto.pageId;
    const username = pageImportDto.user;
    const tag = pageImportDto.tag;
    const website = pageImportDto.website;

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
