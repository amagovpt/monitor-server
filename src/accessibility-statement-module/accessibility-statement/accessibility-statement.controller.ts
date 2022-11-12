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

  @Get(':id')
  async findOneById(@Param('id') id: number) {
    return success(await this.accessibilityStatementService.findById(id));
  }

  @Get('conformance')
  async findAllByConformance() {
    return success(await this.accessibilityStatementService.getByConformance());
  }

  @Get('state')
  async findAllByState() {
    return success(await this.accessibilityStatementService.getByState());
  }

  @Get('directory')
  async findAllByDirectory() {
    return success(await this.accessibilityStatementService.getByDirectory());
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
