import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateAccessibilityStatementDto } from './dto/create-accessibility-statement.dto';
import { UpdateAccessibilityStatementDto } from './dto/update-accessibility-statement.dto';
import { AccessibilityStatement } from './entities/accessibility-statement.entity';
import { InjectRepository } from "@nestjs/typeorm";
import { PageParser } from './page-parser';

@Injectable()
export class AccessibilityStatementService {
  constructor(
    @InjectRepository(AccessibilityStatement)
    private readonly accessibilityStatementRepository: Repository<AccessibilityStatement>) {
  }
  createIfExist(html: string, createAccessibilityStatementDto: CreateAccessibilityStatementDto) {
    const pageParser = new PageParser(html);
    if (pageParser.verifyAccessiblityStatement())
      return;
    return this.create(createAccessibilityStatementDto);
  }

  create(createAccessibilityStatementDto: CreateAccessibilityStatementDto) {
      return 'This action adds a new accessibilityStatement';
  }

  findAll() {
    return `This action returns all accessibilityStatement`;
  }

  findOne(id: number) {
    return `This action returns a #${id} accessibilityStatement`;
  }

  update(id: number, updateAccessibilityStatementDto: UpdateAccessibilityStatementDto) {
    return `This action updates a #${id} accessibilityStatement`;
  }

  remove(id: number) {
    return `This action removes a #${id} accessibilityStatement`;
  }
}
