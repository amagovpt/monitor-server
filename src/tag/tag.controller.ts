import { Controller, InternalServerErrorException, Post, Get, Request, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TagService } from './tag.service';
import { Tag } from './tag.entity';
import { success } from '../lib/response';

@Controller('tag')
export class TagController {

  constructor(private readonly tagService: TagService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('create')
  async createOfficialTag(@Request() req: any): Promise<any> {
    const tag = new Tag();
    tag.Name = req.body.name;
    tag.Show_in_Observatorio = req.body.observatory;
    tag.Creation_Date = new Date();

    const websites = JSON.parse(req.body.websites);
    
    const createSuccess = await this.tagService.createOne(tag, websites);

    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard('jwt-study'))
  @Post('user/create')
  async createStudyMonitorUserTag(@Request() req: any): Promise<any> {
    const tag = new Tag();
    tag.Name = req.body.user_tag_name;
    tag.UserId = req.user.userId;
    tag.Show_in_Observatorio = 0;
    tag.Creation_Date = new Date();

    const type = req.body.type;
    const tagsId = JSON.parse(req.body.tagsId);

    const createSuccess = this.tagService.createUserTag(tag, type, tagsId);

    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('exists/:tagName')
  async checkIfTagNameExists(@Param('tagName') tagName: string): Promise<boolean> {
    return success(!!await this.tagService.findByTagName(tagName.toLowerCase()));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('all')
  async getAllTags(): Promise<any> {
    return success(await this.tagService.findAll());
  }

  @UseGuards(AuthGuard('jwt'), AuthGuard('jwt-study'))
  @Get('allOfficial')
  async getAllOfficialTags(): Promise<any> {
    return success(await this.tagService.findAllOfficial());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('studyMonitor/total')
  async getNumberOfStudyMonitorUsers(): Promise<any> {
    return success(await this.tagService.findNumberOfStudyMonitor());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('observatory/total')
  async getNumberOfObservatoryTags(): Promise<any> {
    return success(await this.tagService.findNumberOfObservatory());
  }

  @UseGuards(AuthGuard('jwt-study'))
  @Get('studyMonitor')
  async getStudyMonitorUserTags(@Request() req: any): Promise<any> {
    return success(await this.tagService.findAllFromStudyMonitorUser(req.user.userId));
  }
}
