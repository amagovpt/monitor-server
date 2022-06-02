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
import { State } from './state';
import { Website } from 'src/website/website.entity';

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
  createIfExist(html: string, website: Website, url: string) {
    const pageParser = new PageParser(html);
    if (!pageParser.verifyAccessiblityStatement() /*&& !pageParser.verifyAccessiblityPossibleStatement(url)*/)
      return;
    const aStatement = pageParser.getAccessiblityStatementData(url);
    const autoList = pageParser.getAutomaticEvaluationData();
    const userList = pageParser.getUserEvaluationData();
    const manualList = pageParser.getManualEvaluationData();
    const state = this.calculateFlag(aStatement, autoList, manualList);
    console.log({ aStatement, autoList, userList, manualList, website });
    return this.create({ ...aStatement, state }, autoList, manualList, userList, website);
  }

  async create(createAccessibilityStatementDto: CreateAccessibilityStatementDto, createAutomaticEvaluationList: CreateAutomaticEvaluationDto[], createManualEvaluationDto: CreateManualEvaluationDto[], createUserEvaluationDto: CreateUserEvaluationDto[], website: Website) {
    const aStatement = await this.createDB(createAccessibilityStatementDto, website);
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

  createDB(createAccessibilityStatementDto: CreateAccessibilityStatementDto, Website: Website) {
    const aStatement = this.accessibilityStatementRepository.create({
      ...createAccessibilityStatementDto, Website
    });
    console.log({ aStatement, createAccessibilityStatementDto });
    return this.accessibilityStatementRepository.save(aStatement);
  }

  calculateFlag(createAccessibilityStatementDto: CreateAccessibilityStatementDto, createAutomaticEvaluationList: CreateAutomaticEvaluationDto[], createManualEvaluationDto: CreateManualEvaluationDto[]) {
    const conformance = createAccessibilityStatementDto.conformance;
    const date = createAccessibilityStatementDto.statementDate;
    const hasAutoEval = createAutomaticEvaluationList.length > 0;
    const hasManualEval = createManualEvaluationDto.length > 0;
    let result;
    if (conformance && date && hasAutoEval && hasManualEval) {
      result = State.completeStatement
    } else if (!conformance && !date && !hasAutoEval && !hasManualEval) {
      result = State.possibleStatement;
    } else {
      result = State.incompleteStatement;
    }
    return result;
  }
}
