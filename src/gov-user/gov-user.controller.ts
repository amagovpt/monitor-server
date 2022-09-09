import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GovUserService } from './gov-user.service';
import { CreateGovUserDto } from './dto/create-gov-user.dto';
import { UpdateGovUserDto } from './dto/update-gov-user.dto';
import { success } from 'src/lib/response';

@Controller('gov-user')
export class GovUserController {
  constructor(private readonly govUserService: GovUserService) { }

  @Post("create")
  create(@Body() createGovUserDto: CreateGovUserDto) {
    return success(this.govUserService.create(createGovUserDto));
  }

  @Get("all")
  findAll() {
    return success(this.govUserService.findAll());
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return success(this.govUserService.findOne(+id));
  }

  @Post("update")
  update(@Body() updateGovUserDto: UpdateGovUserDto) {
    return success(this.govUserService.update(updateGovUserDto));
  }

  @Post('delete')
  remove(@Body() updateGovUserDto: UpdateGovUserDto) {
    return success(this.govUserService.remove(updateGovUserDto.id));
  }
}
