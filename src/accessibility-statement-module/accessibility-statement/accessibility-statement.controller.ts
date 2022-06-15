import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { success } from 'src/lib/response';
import { AccessibilityStatementService } from './accessibility-statement.service';
import { CreateAccessibilityStatementDto } from './dto/create-accessibility-statement.dto';
import { UpdateAccessibilityStatementDto } from './dto/update-accessibility-statement.dto';

@Controller('accessibility-statement')
export class AccessibilityStatementController {
  constructor(private readonly accessibilityStatementService: AccessibilityStatementService) {}

  @Get('website/:name')
  async findOne(@Param('name') name: string) {
    return success(await this.accessibilityStatementService.findByWebsiteName(name));
  }

 /* @Post()
  create(@Body() createAccessibilityStatementDto: CreateAccessibilityStatementDto) {
    return this.accessibilityStatementService.create(createAccessibilityStatementDto);
  }

  @Get()
  findAll() {
    return this.accessibilityStatementService.findAll();
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
