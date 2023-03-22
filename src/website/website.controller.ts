import {
  Controller,
  InternalServerErrorException,
  Request,
  Get,
  Post,
  UseGuards,
  Param,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import * as SqlString from "sqlstring";
import { WebsiteService } from "./website.service";
import { Website } from "./website.entity";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiBasicAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { WebsitesIdDto } from "./dto/websites-id.dto";
import { CreateWebsiteDto } from "./dto/create-website.dto";
import { UpdateWebsiteDto } from "./dto/update-website.dto";

@ApiBasicAuth()
@ApiTags('website')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("website")
@UseInterceptors(LoggingInterceptor)
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @ApiOperation({ summary: 'Reevaluate all pages from website' })
  @ApiResponse({
    status: 200,
    description: 'The evaluation request has been submited',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("reEvaluate")
  async reEvaluateWebsitePages(@Body() websitesIdDto: WebsitesIdDto): Promise<Boolean> {
    return success(
      await this.websiteService.addPagesToEvaluate(websitesIdDto.websitesId, websitesIdDto.option)
    );
  }

  @ApiOperation({ summary: 'Create website' })
  @ApiResponse({
    status: 200,
    description: 'The website has been created',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("create")
  async createWebsite(@Body() websiteDto: CreateWebsiteDto): Promise<any> {
 
    const createSuccess = await this.websiteService.createOne(
      websiteDto,
      websiteDto.entities,
      websiteDto.tags
    );
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }


  @ApiOperation({ summary: 'Update website' })
  @ApiResponse({
    status: 200,
    description: 'The website has been updated',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("update")
  async updateWebsite(@Body() updateWebsiteDto: UpdateWebsiteDto): Promise<any> {

    const updateSuccess = await this.websiteService.update(
      updateWebsiteDto
    );
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("pages/updateObservatory")
  async updateWebsitePagesObservatory(@Request() req: any): Promise<any> {
    const pages = JSON.parse(req.body.pages);
    const pagesId = JSON.parse(req.body.pagesId);
    return success(
      await this.websiteService.updatePagesObservatory(pages, pagesId)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("deleteBulk")
  async deleteWebsites(@Request() req: any): Promise<any> {
    const websitesId = JSON.parse(req.body.websitesId);

    const deleteSuccess = await this.websiteService.deleteBulk(websitesId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteWebsite(@Request() req: any): Promise<any> {
    const websiteId = req.body.websiteId;

    const deleteSuccess = await this.websiteService.delete(websiteId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("myMonitor/url/:website")
  async getMyMonitorUserWebsiteDomain(
    @Request() req: any,
    @Param("website") website: string
  ): Promise<any> {
    return success(
      await this.websiteService.findMyMonitorUserWebsiteStartingUrl(
        req.user.userId,
        website
      )
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("pages/deleteBulk")
  async deleteWebsitesaPages(@Request() req: any): Promise<any> {
    const websitesId = JSON.parse(req.body.websitesId);

    const deleteSuccess = await this.websiteService.pagesDeleteBulk(websitesId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("import")
  async importWebsiteFromMyMonitor(@Request() req: any): Promise<any> {
    const websiteId = req.body.websiteId;
    const websiteName = req.body.websiteName;

    return success(await this.websiteService.import(websiteId, websiteName));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all/count/:search")
  async getAdminWebsiteCount(@Param("search") search: string): Promise<any> {
    return success(
      await this.websiteService.adminCount(
        decodeURIComponent(search.substring(7))
      )
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all/:size/:page/:sort/:direction/:search")
  async getAllWebsites(
    @Param("size") size: string,
    @Param("page") page: string,
    @Param("sort") sort: string,
    @Param("direction") direction: string,
    @Param("search") search: string
  ): Promise<any> {
    return success(
      await this.websiteService.findAll(
        parseInt(size),
        parseInt(page),
        sort.substring(5),
        direction.substring(10),
        decodeURIComponent(search.substring(7))
      )
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("info/:websiteId")
  async getWebsiteInfo(@Param("websiteId") websiteId: number): Promise<any> {
    return success(await this.websiteService.findInfo(websiteId));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":website/user/:user/pages")
  async getAllWebsiteDomains(
    @Param("website") website: string,
    @Param("user") user: string
  ): Promise<any> {
    const websiteId = await this.websiteService.getIdFromUserAndName(
      user,
      website
    );

    return success(await this.websiteService.findAllPages(websiteId));
  }
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("csv")
  async getAllWebsiteCSVData(): Promise<any> {  
    return success(await this.websiteService.getAllWebsiteDataCSV());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("pages/:websiteId")
  async getAllWebsitePages(
    @Param("websiteId") websiteId: number
  ): Promise<any> {
    return success(await this.websiteService.findAllPages(websiteId));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("official")
  async getAllOfficialWebsites(): Promise<any> {
    return success(await this.websiteService.findAllOfficial());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("withoutUser")
  async getWebsitesWithoutUser(): Promise<any> {
    return success(await this.websiteService.findAllWithoutUser());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("withoutEntity")
  async getWebsitesWithoutEntity(): Promise<any> {
    return success(await this.websiteService.findAllWithoutEntity());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("studyMonitor/total")
  async getNumberOfStudyMonitorUsers(): Promise<any> {
    return success(await this.websiteService.findNumberOfStudyMonitor());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("myMonitor/total")
  async getNumberOfMyMonitorUsers(): Promise<any> {
    return success(await this.websiteService.findNumberOfMyMonitor());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("observatory/total")
  async getNumberOfObservatoryTags(): Promise<any> {
    return success(await this.websiteService.findNumberOfObservatory());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/:name")
  async checkIfWebsiteExists(@Param("name") name: string): Promise<any> {
    return success(!!(await this.websiteService.findByOfficialName(name)));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/url/:url")
  async checkIfWebsiteUrlExists(@Param("url") url: string): Promise<any> {
    return success(
      !!(await this.websiteService.existsUrl(decodeURIComponent(url)))
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("isInObservatory")
  async checkIfIsInObservatory(@Request() req: any): Promise<any> {
    return success(
      await this.websiteService.isInObservatory(
        req.user.userId,
        req.body.website
      )
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("transferObservatoryPages")
  async transferObservatoryPages(@Request() req: any): Promise<any> {
    return success(
      await this.websiteService.transferObservatoryPages(
        req.user.userId,
        req.body.website
      )
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("myMonitor")
  async getMyMonitorUserWebsites(@Request() req: any): Promise<any> {
    return success(
      await this.websiteService.findAllFromMyMonitorUser(req.user.userId)
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("myMonitor/reEvaluate")
  async reEvaluateMyMonitorUserWebsitePages(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const website = req.body.website;

    return success(
      await this.websiteService.reEvaluateMyMonitorWebsite(userId, website)
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("studyMonitor/reEvaluate")
  async reEvaluateStudyMonitorUserTagWebsitePages(
    @Request() req: any
  ): Promise<any> {
    const userId = req.user.userId;
    const tag = req.body.tag;
    const website = req.body.website;

    return success(
      await this.websiteService.reEvaluateStudyMonitorWebsite(
        userId,
        tag,
        website
      )
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Get("studyMonitor/tag/:tag")
  async getStudyMonitorUserTagWebsites(
    @Request() req: any,
    @Param("tag") tag: string
  ): Promise<any> {
    const userId = req.user.userId;
    return success(
      await this.websiteService.findAllFromStudyMonitorUserTag(userId, tag)
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Get("studyMonitor/otherTags/:tag")
  async getStudyMonitorUserOtherTagsWebsites(
    @Request() req: any,
    @Param("tag") tag: string
  ): Promise<any> {
    const userId = req.user.userId;
    return success(
      await this.websiteService.findAllFromStudyMonitorUserOtherTagsWebsites(
        userId,
        tag
      )
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Get("studyMonitor/tag/:tag/website/nameExists/:website")
  async checkIfStudyMonitorUserTagWebsiteNameExists(
    @Request() req: any,
    @Param("tag") tag: string,
    @Param("website") website: string
  ): Promise<any> {
    const userId = req.user.userId;
    return success(
      !!(await this.websiteService.findStudyMonitorUserTagWebsiteByName(
        userId,
        tag,
        website
      ))
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Get("studyMonitor/tag/:tag/websiteExists/:startingUrl")
  async checkIfStudyMonitorUserTagWebsiteExists(
    @Request() req: any,
    @Param("tag") tag: string,
    @Param("startingUrl") startingUrl: string
  ): Promise<any> {
    const userId = req.user.userId;
    return success(
      !!(await this.websiteService.findStudyMonitorUserTagWebsiteByStartingUrl(
        userId,
        tag,
        startingUrl
      ))
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("studyMonitor/link")
  async linkStudyMonitorUserTagWebsite(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const tag = req.body.tag;
    const websitesId = JSON.parse(req.body.websitesId);

    const linkSuccess =
      await this.websiteService.linkStudyMonitorUserTagWebsite(
        userId,
        tag,
        websitesId
      );
    if (!linkSuccess) {
      throw new InternalServerErrorException();
    }

    return success(
      await this.websiteService.findAllFromStudyMonitorUserTag(userId, tag)
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("studyMonitor/create")
  async createStudyMonitorUserTagWebsite(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const tag = req.body.tag;
    const websiteName = req.body.name;
    const startingUrl = decodeURIComponent(req.body.startingUrl);
    const pages = JSON.parse(req.body.pages).map((page: string) =>
      decodeURIComponent(page)
    );

    const createSuccess =
      await this.websiteService.createStudyMonitorUserTagWebsite(
        userId,
        tag,
        websiteName,
        startingUrl,
        pages
      );
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(
      await this.websiteService.findAllFromStudyMonitorUserTag(userId, tag)
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("studyMonitor/remove")
  async removeStudyMonitorUserTagWebsite(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const tag = req.body.tag;
    const websitesId = JSON.parse(req.body.websitesId);

    const removeSuccess =
      await this.websiteService.removeStudyMonitorUserTagWebsite(
        userId,
        tag,
        websitesId
      );
    if (!removeSuccess) {
      throw new InternalServerErrorException();
    }

    return success(
      await this.websiteService.findAllFromStudyMonitorUserTag(userId, tag)
    );
  }
}
