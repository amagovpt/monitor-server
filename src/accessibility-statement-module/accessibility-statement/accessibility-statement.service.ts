import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateAccessibilityStatementDto } from './dto/create-accessibility-statement.dto';
import { AccessibilityStatement } from './entities/accessibility-statement.entity';
import { InjectRepository } from "@nestjs/typeorm";
import { PageParser } from './page-parser';
import { AutomaticEvaluationService } from '../automatic-evaluation/automatic-evaluation.service';
import { ManualEvaluationService } from '../manual-evaluation/manual-evaluation.service';
import { UserEvaluationService } from '../user-evaluation/user-evaluation.service';
import { CreateAutomaticEvaluationDto } from '../automatic-evaluation/dto/create-automatic-evaluation.dto';
import { CreateManualEvaluationDto } from '../manual-evaluation/dto/create-manual-evaluation.dto';
import { CreateUserEvaluationDto } from '../user-evaluation/dto/create-user-evaluation.dto';
import { Page } from 'src/page/page.entity';

@Injectable()
export class AccessibilityStatementService {
  constructor(
    @InjectRepository(AccessibilityStatement)
    private readonly accessibilityStatementRepository: Repository<AccessibilityStatement>,
    private automaticEvaluationService: AutomaticEvaluationService,
    private manualEvaluationService: ManualEvaluationService,
    private userEvaluationService: UserEvaluationService,
  ) {
  }
  createIfExist(html: string, page: Page, url: string) {
    const pageParser = new PageParser(html);
    if (!pageParser.verifyAccessiblityStatement())// && !pageParser.verifyAccessiblityPossibleStatement(url))
      return;
    const aStatement = pageParser.getAccessiblityStatementData(url);
    const autoList = pageParser.getAutomaticEvaluationData();
    const userList = pageParser.getUserEvaluationData();
    const manualList = pageParser.getManualEvaluationData();
    console.log({ aStatement, autoList, userList, manualList, page});
    return this.create(aStatement, autoList, manualList, userList, page);
  }

  async create(createAccessibilityStatementDto: CreateAccessibilityStatementDto, createAutomaticEvaluationList: CreateAutomaticEvaluationDto[], createManualEvaluationDto: CreateManualEvaluationDto[], createUserEvaluationDto: CreateUserEvaluationDto[], page: Page) {
    const aStatement = await this.createDB(createAccessibilityStatementDto, page);
    aStatement.automaticEvaluationList = await Promise.all(createAutomaticEvaluationList.map(async (evalu) => {
      return await this.automaticEvaluationService.create(evalu, aStatement);
    }));
    aStatement.manualEvaluationList = await Promise.all(createManualEvaluationDto.map(async (evalu) => {
      return await this.manualEvaluationService.create(evalu, aStatement);
    }));
    aStatement.userEvaluationList = await Promise.all(createUserEvaluationDto.map(async (evalu) => {
      return await this.userEvaluationService.create(evalu, aStatement);
    }));

    return aStatement;
  }

  createDB(createAccessibilityStatementDto: CreateAccessibilityStatementDto, Page: Page) {
    const aStatement = this.accessibilityStatementRepository.create({
      ...createAccessibilityStatementDto, Page
    });
    console.log({ aStatement, createAccessibilityStatementDto });
    return this.accessibilityStatementRepository.save(aStatement);
  }
}
