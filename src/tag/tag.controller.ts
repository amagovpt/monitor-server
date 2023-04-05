import {
  Controller,
  InternalServerErrorException,
  Post,
  Get,
  Request,
  Param,
  UseGuards,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { TagService } from "./tag.service";
import { Tag } from "./tag.entity";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiBasicAuth, ApiTags, ApiResponse, ApiOperation } from "@nestjs/swagger";
import { TagReEvaluateDto } from "./dto/tag-reevalute.dto";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { DeleteTagDto } from "./dto/delete-tag.dto";
import { DeleteTagBulkDto } from "./dto/delete-tag-bulk.dto";

@ApiBasicAuth()
@ApiTags('tag')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("tag")
@UseInterceptors(LoggingInterceptor)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @ApiOperation({ summary: 'Reevaluate all pages from a tag' })
  @ApiResponse({
    status: 200,
    description: 'The evaluation request has been submited',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("reEvaluate")
  async reEvaluateWebsitePages(@Body() tagReEvaluateDto: TagReEvaluateDto): Promise<any> {
    const tagsId = tagReEvaluateDto.tagsId;
    const option = tagReEvaluateDto.option;

    return success(await this.tagService.addPagesToEvaluate(tagsId, option));
  }

  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 200,
    description: 'The tag was created',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("create")
  async createOfficialTag(@Body() createTagDto: CreateTagDto): Promise<any> {
    const tag = new Tag();
    tag.Name = createTagDto.name;
    tag.Creation_Date = new Date();

    const directories = createTagDto.directories;
    const websites = createTagDto.websites;

    const createSuccess = await this.tagService.createOne(
      tag,
      directories,
      websites
    );

    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Update a specific tag' })
  @ApiResponse({
    status: 200,
    description: 'The tag was updated',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("update")
  async updateOfficialTag(@Body() updateTagDto: UpdateTagDto): Promise<any> {
    const tagId = updateTagDto.tagId;
    const name = updateTagDto.name;
    const defaultDirectories = updateTagDto.defaultDirectories;
    const directories = updateTagDto.directories;
    const defaultWebsites = updateTagDto.defaultWebsites;
    const websites = updateTagDto.websites;

    const updateSuccess = await this.tagService.update(
      tagId,
      name,
      defaultDirectories,
      directories,
      defaultWebsites,
      websites
    );

    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Delete a specific tag' })
  @ApiResponse({
    status: 200,
    description: 'The tag was deleted',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteOfficialTag(@Body() deleteTagDto: DeleteTagDto): Promise<any> {
    const tagId = deleteTagDto.tagId;

    const deleteSuccess = await this.tagService.delete(tagId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Delete a list of tags' })
  @ApiResponse({
    status: 200,
    description: 'The tags were deleted',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("deleteBulk")
  async deleteBulkOfficialTags(@Body() deleteTagBulkDto: DeleteTagBulkDto): Promise<any> {
    const tagsId = deleteTagBulkDto.tagsId;

    const deleteSuccess = await this.tagService.deleteBulk(tagsId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("pages/deleteBulk")
  async deleteBulkOfficialTagsPages(@Request() req: any): Promise<any> {
    const tagsId = JSON.parse(req.body.tagsId);

    const deleteSuccess = await this.tagService.pagesDeleteBulk(tagsId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("user/create")
  async createStudyMonitorUserTag(@Request() req: any): Promise<any> {
    const tag = new Tag();
    tag.Name = req.body.user_tag_name;
    tag.UserId = req.user.userId;
    tag.Creation_Date = new Date();

    const type = req.body.type;
    const tagsId = JSON.parse(req.body.tagsId);

    const createSuccess = await this.tagService.createUserTag(
      tag,
      type,
      tagsId
    );

    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("user/remove")
  async removeStudyMonitorUserTag(@Request() req: any): Promise<any> {
    const tagsId = JSON.parse(req.body.tagsId);

    const removeSuccess = await this.tagService.removeUserTag(tagsId);

    if (!removeSuccess) {
      throw new InternalServerErrorException();
    }

    return success(
      await this.tagService.findAllFromStudyMonitorUser(req.user.userId)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("import")
  async importTag(@Request() req: any): Promise<any> {
    const tagId = req.body.tagId;
    const tagName = req.body.tagName;

    return success(await this.tagService.import(tagId, tagName));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/:tagName")
  async checkIfTagNameExists(
    @Param("tagName") tagName: string
  ): Promise<boolean> {
    return success(!!(await this.tagService.findByOfficialTagName(tagName)));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all")
  async getAllTags(): Promise<any> {
    return success(await this.tagService.findAll());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":tag/user/:user/websites/study")
  async getUserTagWebsites(
    @Param("tag") tag: string,
    @Param("user") user: string
  ): Promise<any> {
    const websites = await this.tagService.findAllUserTagWebsites(tag, user);

    for (const website of websites || []) {
      website["imported"] = await this.tagService.verifyUpdateWebsiteAdmin(
        website.WebsiteId
      );

      const websiteAdmin = await this.tagService.websiteExistsInAdmin(
        website.WebsiteId
      );
      website["hasWebsite"] = websiteAdmin.length === 1;
      website["webName"] = undefined;

      if (websiteAdmin.length === 1) {
        website["webName"] = websiteAdmin[0].Name;
      }
    }

    return success(websites);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":tag/user/:user/websites")
  async getTagWebsites(
    @Param("tag") tag: string,
    @Param("user") user: string
  ): Promise<any> {
    return success(await this.tagService.findAllUserTagWebsites(tag, user));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":tag/website/:website/user/:user/pages")
  async getUserWebsitePages(
    @Param("tag") tag: string,
    @Param("website") website: string,
    @Param("user") user: string
  ): Promise<any> {
    return success(
      await this.tagService.findAllUserWebsitePages(tag, website, user)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":tag/websites/pages")
  async getListOfTagWebsitePages(@Param("tag") tag: string): Promise<any> {
    return success(await this.tagService.findAllWebsitePages(tag));
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("info/:tagId")
  async getTagInfo(@Param("tagId") tagId: number): Promise<any> {
    return success(await this.tagService.findInfo(tagId));
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("allOfficial")
  async getAllOfficialTags(): Promise<any> {
    return success(await this.tagService.findAllOfficial());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("studyMonitor/total")
  async getNumberOfStudyMonitorUsers(): Promise<any> {
    return success(await this.tagService.findNumberOfStudyMonitor());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("observatory/total")
  async getNumberOfObservatoryTags(): Promise<any> {
    return success(await this.tagService.findNumberOfObservatory());
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Get("studyMonitor")
  async getStudyMonitorUserTags(@Request() req: any): Promise<any> {
    return success(
      await this.tagService.findAllFromStudyMonitorUser(req.user.userId)
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Get("studyMonitor/:tag/data")
  async getStudyMonitorUserTagData(
    @Request() req: any,
    @Param("tag") tag: string
  ): Promise<any> {
    return success(
      await this.tagService.findStudyMonitorUserTagData(req.user.userId, tag)
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Get("studyMonitor/:tag/website/:website/data")
  async getStudyMonitorUserTagWebsitesPagesData(
    @Request() req: any,
    @Param("tag") tag: string,
    @Param("website") website: string
  ): Promise<any> {
    return success(
      await this.tagService.findStudyMonitorUserTagWebsitesPagesData(
        req.user.userId,
        tag,
        website
      )
    );
  }
}
