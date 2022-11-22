import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { success } from 'src/lib/response';
import { AccessibilityStatementService } from './accessibility-statement.service';

@Controller('accessibility-statement')
export class AccessibilityStatementController {
  constructor(private readonly accessibilityStatementService: AccessibilityStatementService) {}

  @Get('website/:name')
  async findOne(@Param('name') name: string) {
    return success(await this.accessibilityStatementService.findByWebsiteName(name));
  }

  @Get()
  async findAll() {
    return success(await this.accessibilityStatementService.getASList());
  }

  @Get('id/:id')
  async findOneById(@Param('id') id: number) {
    return success(await this.accessibilityStatementService.findById(id));
  }

  @Get('year')
  async findAllByYear() {
    return success(await this.accessibilityStatementService.getByAge());
  }

  @Get('conformance')
  async findAllByConformance() {
    return success(await this.accessibilityStatementService.getByConformance());
  }

  @Get('seal')
  async findAllBySeal() {
    return success(await this.accessibilityStatementService.getBySeal());
  }

  @Get('state')
  async findAllByState() {
    return success(await this.accessibilityStatementService.getByState());
  }

  @Get('directory/state')
  async findAllByDirectoryState() {
    return success(await this.accessibilityStatementService.getByDirectoryState());
  }

  @Get('directory/seal')
  async findAllByDirectorySeal() {
    return success(await this.accessibilityStatementService.getByDirectorySeal());
  }

  @Get('directory/conformance')
  async findAllByDirectoryConformity() {
    return success(await this.accessibilityStatementService.getByDirectoryConformity());
  }


  @Get('directory/OPAW')
  async findAllByDirectoryWebsite() {
    return success(await this.accessibilityStatementService.getOPAWTable());
  }

  @Get('evaluations')
  async findNumberOfEvaluationByType() {
    return success(await this.accessibilityStatementService.getNumberOfEvaluationByType());
  }

 /* @Post()
  create(@Body() createAccessibilityStatementDto: CreateAccessibilityStatementDto) {
    return this.accessibilityStatementService.create(createAccessibilityStatementDto);
  }

 

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accessibilityStatementService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccessibilityStatementDto: UpdateAccessibilityStatementDto) {
    return this.accessibilityStatementService.update(+id, updateAccessibilityStatementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accessibilityStatementService.remove(+id);
  }*/
}
