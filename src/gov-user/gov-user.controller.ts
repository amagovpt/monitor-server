import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GovUserService } from './gov-user.service';
import { CreateGovUserDto } from './dto/create-gov-user.dto';
import { UpdateGovUserDto } from './dto/update-gov-user.dto';
import { success } from 'src/lib/response';

@Controller('gov-user')
export class GovUserController {
  constructor(private readonly govUserService: GovUserService) { }

  @Post("create")
  async create(@Body() createGovUserDto: CreateGovUserDto) {
    return success(await this.govUserService.create(createGovUserDto));
  }

  @Get("all")
  async findAll() {
    return success(await this.govUserService.findAll());
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return success(await this.govUserService.findOne(+id));
  }

  @Post("update")
  async update(@Body() updateGovUserDto: UpdateGovUserDto) {
    return success(await this.govUserService.update(updateGovUserDto));
  }

  @Post('delete')
  async remove(@Body() updateGovUserDto: UpdateGovUserDto) {
    return success(await this.govUserService.remove(updateGovUserDto.id));
  }
}