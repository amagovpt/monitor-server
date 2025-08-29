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
  Delete,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { WebsiteService } from "./website.service";
import { Website } from "./website.entity";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { WebsitesIdDto } from "./dto/websites-id.dto";
import { CreateWebsiteDto } from "./dto/create-website.dto";
import { UpdateWebsiteDto } from "./dto/update-website.dto";
import { UpdateObservatoryPages } from "./dto/update-observatory-pages.dto";
import { DeleteWebsiteDto } from "./dto/delete-website.dto";
import { DeleteBulkWebsiteDto } from "./dto/delete-bulk-website.dto";
import { ImportWebsiteMyMonitorDto } from "./dto/import-website-my-monitor.dto";
import { Page } from "src/page/page.entity";
import { WebsiteMyMonitorDto } from "./dto/website-my-monitor.dto";

@ApiBasicAuth()
@ApiTags("website")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("website")
@UseInterceptors(LoggingInterceptor)
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @ApiOperation({ summary: "Reevaluate all pages from website" })
  @ApiResponse({
    status: 200,
    description: "The evaluation request has been submited",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("accessibility-statement/update")
  async accessibilityStatementUpdate(): Promise<any> {
    return success(await this.websiteService.findAccessiblityStatements());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("accessibility-statement/update/:id")
  async accessibilityStatementUpdateById(
    @Param("id") id: number
  ): Promise<any> {
    await this.websiteService.updateAStatement(id);
    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("reEvaluate")
  async reEvaluateWebsitePages(
    @Body() websitesIdDto: WebsitesIdDto
  ): Promise<any> {
    return success(
      await this.websiteService.addPagesToEvaluate(
        websitesIdDto.websitesId,
        websitesIdDto.option
      )
    );
  }

  @ApiOperation({ summary: "Create website" })
  @ApiResponse({
    status: 200,
    description: "The website has been created",
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

  @ApiOperation({ summary: "Update website" })
  @ApiResponse({
    status: 200,
    description: "The website has been updated",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("update")
  async updateWebsite(
    @Body() updateWebsiteDto: UpdateWebsiteDto
  ): Promise<any> {
    const updateSuccess = await this.websiteService.update(updateWebsiteDto);
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Update pages in the observatory" })
  @ApiResponse({
    status: 200,
    description: "The pages in the observatory have been updated",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("pages/updateObservatory")
  async updateWebsitePagesObservatory(
    @Body() updateObservatoryPages: UpdateObservatoryPages
  ): Promise<any> {
    return success(
      await this.websiteService.updatePagesObservatory(updateObservatoryPages)
    );
  }

  @ApiOperation({ summary: "Delete websites" })
  @ApiResponse({
    status: 200,
    description: "The website list has been deleted",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("deleteBulk")
  async deleteWebsites(
    @Body() deleteBulkWebsiteDto: DeleteBulkWebsiteDto
  ): Promise<any> {
    const deleteSuccess = await this.websiteService.deleteBulk(
      deleteBulkWebsiteDto.websitesId
    );
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Delete website" })
  @ApiResponse({
    status: 200,
    description: "The website has been deleted",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteWebsite(
    @Body() deleteWebsiteDto: DeleteWebsiteDto
  ): Promise<any> {
    const deleteSuccess = await this.websiteService.delete(
      deleteWebsiteDto.websiteId
    );
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({
    summary: "Finds a website, by the starting URL, from the current user",
  })
  @ApiResponse({
    status: 200,
    description: "The website has been found",
    type: Boolean,
  })
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

  @ApiOperation({ summary: "Deletes all pages from a list of websites" })
  @ApiResponse({
    status: 200,
    description: "The selected pages have been deleted",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("pages/deleteBulk")
  async deleteWebsitesaPages(
    @Body() deleteBulkWebsiteDto: DeleteBulkWebsiteDto
  ): Promise<any> {
    const deleteSuccess = await this.websiteService.pagesDeleteBulk(
      deleteBulkWebsiteDto.websitesId
    );
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Imports a website from MyMonitor" })
  @ApiResponse({
    status: 200,
    description: "The selected website has been imported",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("import")
  async importWebsiteFromMyMonitor(
    @Body() importWebsiteMyMonitorDto: ImportWebsiteMyMonitorDto
  ): Promise<any> {
    const websiteId = importWebsiteMyMonitorDto.websiteId;
    const websiteName = importWebsiteMyMonitorDto.newWebsiteName;

    return success(await this.websiteService.import(websiteId, websiteName));
  }

  @ApiOperation({
    summary:
      "Calculates the number of websites in AMS filtered by search string",
  })
  @ApiResponse({
    status: 200,
    description: " The number of websites in AMS filtered by search string",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all/count/:search")
  async getAdminWebsiteCount(@Param("search") search: string): Promise<any> {
    return success(
      await this.websiteService.adminCount(
        decodeURIComponent(search.substring(7))
      )
    );
  }

  @ApiOperation({
    summary:
      "Finds websites in AMS filtered by search string, size, sort and direction",
  })
  @ApiResponse({
    status: 200,
    description:
      " The websites in AMS filtered by search string, size, sort and direction",
    type: Array<Website>,
  })
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

  @ApiOperation({ summary: "Find website information by id" })
  @ApiResponse({
    status: 200,
    description: " The specific website information",
    type: Website,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("info/:websiteId")
  async getWebsiteInfo(@Param("websiteId") websiteId: number): Promise<any> {
    return success(await this.websiteService.findInfo(websiteId));
  }

  @ApiOperation({ summary: "Find website by user and name" })
  @ApiResponse({
    status: 200,
    description: " The specific website",
    type: Website,
  })

  @ApiOperation({ summary: "Get count of pages for a specific website with search filter" })
  @ApiResponse({
    status: 200,
    description: "The number of pages in the website matching the search criteria",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":website/user/:user/pages/count/:search")
  async getWebsitePagesCount(
    @Param("website") website: string,
    @Param("user") user: string,
    @Param("search") search: string
  ): Promise<any> {
    const websiteId = await this.websiteService.getIdFromUserAndName(
      user,
      website
    );

    const count = await this.websiteService.findPagesCount(
      websiteId,
      decodeURIComponent(search)
    );

    return success(count);
  }

  @ApiOperation({ summary: "Get paginated and sorted pages for a specific website" })
  @ApiResponse({
    status: 200,
    description: "The pages of the website with pagination, sorting and filtering",
    type: Array<Page>,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":website/user/:user/pages/all/:size/:page/:sort/:direction/:search")
  async getWebsitePagesPaginated(
    @Param("website") website: string,
    @Param("user") user: string,
    @Param("size") size: string,
    @Param("page") page: string,
    @Param("sort") sort: string,
    @Param("direction") direction: string,
    @Param("search") search: string
  ): Promise<any> {
    const websiteId = await this.websiteService.getIdFromUserAndName(
      user,
      website
    );

    return success(
      await this.websiteService.findPagesPaginated(
        websiteId,
        parseInt(size),
        parseInt(page),
        sort.substring(5),
        direction.substring(10),
        decodeURIComponent(search.substring(7))
      )
    );
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

  @ApiOperation({ summary: "Finds all website data to build a csv" })
  @ApiResponse({
    status: 200,
    description: " All the webiste data",
    type: Website,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("csv")
  async getAllWebsiteCSVData(): Promise<any> {
    return success(await this.websiteService.getAllWebsiteDataCSV());
  }

  @ApiOperation({ summary: "Finds all pages from a website by id" })
  @ApiResponse({
    status: 200,
    description: " All pages from the specific website",
    type: Array<Page>,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("pages/:websiteId")
  async getAllWebsitePages(
    @Param("websiteId") websiteId: number
  ): Promise<any> {
    return success(await this.websiteService.findAllPages(websiteId));
  }

  @ApiOperation({
    summary: "Finds all websites excluding Study Monitor websites",
  })
  @ApiResponse({
    status: 200,
    description: "The list of websites",
    type: Array<Website>,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("official")
  async getAllOfficialWebsites(): Promise<any> {
    return success(await this.websiteService.findAllOfficial());
  }

  @ApiOperation({ summary: "Finds all websites without user" })
  @ApiResponse({
    status: 200,
    description: "The list of websites",
    type: Array<Website>,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("withoutUser")
  async getWebsitesWithoutUser(): Promise<any> {
    return success(await this.websiteService.findAllWithoutUser());
  }

  @ApiOperation({ summary: "Finds all websites without entity" })
  @ApiResponse({
    status: 200,
    description: "The list of websites",
    type: Array<Website>,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("withoutEntity")
  async getWebsitesWithoutEntity(): Promise<any> {
    return success(await this.websiteService.findAllWithoutEntity());
  }

  @ApiOperation({ summary: "Finds the number of websites in study monitor" })
  @ApiResponse({
    status: 200,
    description: "The number of websites",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("studyMonitor/total")
  async getNumberOfStudyMonitorWebsites(): Promise<any> {
    return success(await this.websiteService.findNumberOfStudyMonitor());
  }

  @ApiOperation({ summary: "Finds the number of websites in my monitor" })
  @ApiResponse({
    status: 200,
    description: "The number of websites",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("myMonitor/total")
  async getNumberOfMyMonitorWebsites(): Promise<any> {
    return success(await this.websiteService.findNumberOfMyMonitor());
  }

  @ApiOperation({ summary: "Finds the number of websites in observatory" })
  @ApiResponse({
    status: 200,
    description: "The number of websites",
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("observatory/total")
  async getNumberOfObservatoryWebsites(): Promise<any> {
    return success(await this.websiteService.findNumberOfObservatory());
  }

  @ApiOperation({ summary: "Check if website exists by name" })
  @ApiResponse({
    status: 200,
    description: "The specific website",
    type: Website,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/:name")
  async checkIfWebsiteExists(@Param("name") name: string): Promise<any> {
    return success(!!(await this.websiteService.findByOfficialName(name)));
  }

  @ApiOperation({ summary: "Check if website exists by starting url" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/url/:url")
  async checkIfWebsiteUrlExists(@Param("url") url: string): Promise<any> {
    return success(
      !!(await this.websiteService.existsUrl(decodeURIComponent(url)))
    );
  }

  @ApiOperation({ summary: "Check if website is in observatory" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("isInObservatory")
  async checkIfIsInObservatory(
    websiteMyMonitorDto: WebsiteMyMonitorDto
  ): Promise<any> {
    return success(
      await this.websiteService.isInObservatory(
        websiteMyMonitorDto.userId,
        websiteMyMonitorDto.website
      )
    );
  }

  @ApiOperation({
    summary:
      "Transfers observatory pages from a specific website to a specific user",
  })
  @ApiResponse({
    status: 200,
    description: "The transfer was a success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("transferObservatoryPages")
  async transferObservatoryPages(
    @Request() req: any,
    @Body() websiteMyMonitorDto: WebsiteMyMonitorDto
  ): Promise<any> {
    return success(
      await this.websiteService.transferObservatoryPages(
        req.user.userId,
        websiteMyMonitorDto.website
      )
    );
  }

  @ApiOperation({ summary: "Finds all websites from a specific user" })
  @ApiResponse({
    status: 200,
    description: "The list of websites",
    type: Array<Website>,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("myMonitor")
  async getMyMonitorUserWebsites(@Request() req: any): Promise<any> {
    return success(
      await this.websiteService.findAllFromMyMonitorUser(req.user.userId)
    );
  }

  @ApiOperation({
    summary: "Reevalute all pages from a specific website in My Monitor",
  })
  @ApiResponse({
    status: 200,
    description: "The page evaluation was submited",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("myMonitor/reEvaluate")
  async reEvaluateMyMonitorUserWebsitePages(
    websiteMyMonitorDto: WebsiteMyMonitorDto
  ): Promise<any> {
    const userId = websiteMyMonitorDto.userId;
    const website = websiteMyMonitorDto.website;

    return success(
      await this.websiteService.reEvaluateMyMonitorWebsite(userId, website)
    );
  }

  @ApiOperation({
    summary: "Reevalute all pages from a specific website in Study Monitor",
  })
  @ApiResponse({
    status: 200,
    description: "The page evaluation was submited",
    type: Boolean,
  })
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

  @ApiOperation({
    summary: "Find all websites from a specific user and tag in Study Monitor",
  })
  @ApiResponse({
    status: 200,
    description: "The website list",
    type: Array<Website>,
  })
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

  @ApiOperation({
    summary: "Find all websites from a specific user and tag in Study Monitor",
  })
  @ApiResponse({
    status: 200,
    description: "The website list",
    type: Array<Website>,
  })
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

  @ApiOperation({
    summary: "Find all websites from a specific user and tag in Study Monitor",
  })
  @ApiResponse({
    status: 200,
    description: "The website list",
    type: Array<Website>,
  })
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

  @ApiOperation({
    summary: "Check if website exists in specific tag in Study Monitor",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<Website>,
  })
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

  @ApiOperation({ summary: "Link a website to a tag in Study Monitor" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<Website>,
  })
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

  @ApiOperation({ summary: "Create a website in Study Monitor" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Website,
  })
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

  @ApiOperation({ summary: "Remove a website to a tag in Study Monitor" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
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
