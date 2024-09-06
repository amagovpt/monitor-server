import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ManualEvaluationService } from "./manual-evaluation.service";
import { CreateManualEvaluationDto } from "./dto/create-manual-evaluation.dto";
import { UpdateManualEvaluationDto } from "./dto/update-manual-evaluation.dto";

@Controller("manual-evaluation")
export class ManualEvaluationController {
  constructor(
    private readonly manualEvaluationService: ManualEvaluationService
  ) {}
  /*
  @Post()
  create(@Body() createManualEvaluationDto: CreateManualEvaluationDto) {
    return this.manualEvaluationService.create(createManualEvaluationDto);
  }

  @Get()
  findAll() {
    return this.manualEvaluationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.manualEvaluationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateManualEvaluationDto: UpdateManualEvaluationDto) {
    return this.manualEvaluationService.update(+id, updateManualEvaluationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.manualEvaluationService.remove(+id);
  }*/
}
