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
  async createTag(@Request() req: any): Promise<any> {
    const tag = new Tag();
    tag.Name = req.body.name;
    tag.Show_in_Observatorio = req.body.observatory;
    tag.Creation_Date = new Date();
    
    const createSuccess = await this.tagService.createOne(tag);

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

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('allOfficial')
  async getAllOfficialTags(): Promise<any> {
    return success(await this.tagService.findAllOfficial());
  }
}
