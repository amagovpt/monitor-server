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
    if (!pageParser.verifyAccessiblityStatement())
      return;
    console.log(pageParser.getConformance());
  }

  create(createAccessibilityStatementDto: CreateAccessibilityStatementDto) {
    const aStatement = this.accessibilityStatementRepository.create(createAccessibilityStatementDto);
    console.log({ aStatement, createAccessibilityStatementDto});
    return this.accessibilityStatementRepository.save(aStatement);
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
