import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserEvaluationService } from './user-evaluation.service';
import { CreateUserEvaluationDto } from './dto/create-user-evaluation.dto';
import { UpdateUserEvaluationDto } from './dto/update-user-evaluation.dto';

@Controller('user-evaluation')
export class UserEvaluationController {
  constructor(private readonly userEvaluationService: UserEvaluationService) {}

  /*@Post()
  create(@Body() createUserEvaluationDto: CreateUserEvaluationDto) {
    return this.userEvaluationService.create(createUserEvaluationDto);
  }

  @Get()
  findAll() {
    return this.userEvaluationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userEvaluationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserEvaluationDto: UpdateUserEvaluationDto) {
    return this.userEvaluationService.update(+id, updateUserEvaluationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userEvaluationService.remove(+id);
  }*/
}
