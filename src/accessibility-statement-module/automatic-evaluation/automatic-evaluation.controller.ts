import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { AutomaticEvaluationService } from "./automatic-evaluation.service";
import { CreateAutomaticEvaluationDto } from "./dto/create-automatic-evaluation.dto";
import { UpdateAutomaticEvaluationDto } from "./dto/update-automatic-evaluation.dto";

@Controller("automatic-evaluation")
export class AutomaticEvaluationController {
  constructor(
    private readonly automaticEvaluationService: AutomaticEvaluationService
  ) {}
  /*
  @Post()
  create(@Body() createAutomaticEvaluationDto: CreateAutomaticEvaluationDto) {
    return this.automaticEvaluationService.create(createAutomaticEvaluationDto);
  }

  @Get()
  findAll() {
    return this.automaticEvaluationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.automaticEvaluationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAutomaticEvaluationDto: UpdateAutomaticEvaluationDto) {
    return this.automaticEvaluationService.update(+id, updateAutomaticEvaluationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.automaticEvaluationService.remove(+id);
  }*/
}
