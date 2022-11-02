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
import { CreateContactDto } from '../contact/dto/create-contact.dto';
import { ContactService } from '../contact/contact.service';
import { AccessibilityStatementDto } from './dto/accessibility-statement.dto';
var hash = require('object-hash');

@Injectable()
export class AccessibilityStatementService {

  constructor(
    @InjectRepository(AccessibilityStatement)
    private readonly accessibilityStatementRepository: Repository<AccessibilityStatement>,
    private automaticEvaluationService: AutomaticEvaluationService,
    private manualEvaluationService: ManualEvaluationService,
    private userEvaluationService: UserEvaluationService,
    private contactService: ContactService,
  ) {
  }

  async createIfExist(html: string, website: Website, url: string) {
    const currentAS = await this.findLatestByWebsiteID(website.WebsiteId);
    const aStatementParsed = await this.parseAStatement(html, website, url);
    let aStatement;
    if (currentAS && aStatementParsed) {
      const currentHash = currentAS.hash;
      const currentDate = currentAS.statementDate;
      const newhash = hash(aStatementParsed);

      if (currentDate === aStatementParsed.statementDate && currentHash !== newhash) {
        this.deleteById(currentAS.Id);
        aStatement = this.createAStatement(aStatementParsed, website);
      }
    }
    else if (aStatementParsed)
      aStatement = this.createAStatement(aStatementParsed, website);

    return aStatement
  }
  async parseAStatement(html: string, website: Website, url: string): Promise<AccessibilityStatementDto>{
    const pageParser = new PageParser(html);
    if (!pageParser.verifyAccessiblityStatement() /*&& !pageParser.verifyAccessiblityPossibleStatement(url)*/)
      return;
    const aStatementDto = pageParser.getAccessiblityStatementData(url);
    const autoList = pageParser.getAutomaticEvaluationData();
    const userList = pageParser.getUserEvaluationData();
    const manualList = pageParser.getManualEvaluationData();
    const contacts = pageParser.getContacts();
    return {...aStatementDto, autoList, userList, manualList,contacts};

  }

  async createAStatement(aStatementParser:AccessibilityStatementDto, website:Website) {
    const { autoList, userList, manualList, contacts, ...aStatementDto } = aStatementParser;
    const hashResult = hash(aStatementParser);
    const state = this.calculateFlag(aStatementParser);
    let aStatement = await this.createDB({ ...aStatementDto, state }, website);
    aStatement = await this.createLists(aStatement, autoList, manualList, userList);
    aStatement = await this.createContacts(aStatement, contacts);
    this.updateHash(hashResult, aStatement.Id);
    return aStatement;
  }


  async createLists(aStatement: AccessibilityStatement, createAutomaticEvaluationList: CreateAutomaticEvaluationDto[], createManualEvaluationDto: CreateManualEvaluationDto[], createUserEvaluationDto: CreateUserEvaluationDto[]) {
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

  async createContacts(aStatement: AccessibilityStatement, createContactList: CreateContactDto[]) {
    await Promise.all(createContactList.map(async (contact) => {
      return this.contactService.create(contact, aStatement)
    }));
    return aStatement;
  }
  async updateHash(hash: string, id: number) {
    const aStatement = await this.accessibilityStatementRepository.findOne(id);
    aStatement.hash = hash;
    return this.accessibilityStatementRepository.save(aStatement);
  }

  createDB(createAccessibilityStatementDto: CreateAccessibilityStatementDto, Website: Website) {
    const aStatement = this.accessibilityStatementRepository.create({
      ...createAccessibilityStatementDto, Website
    });
    console.log({ aStatement, createAccessibilityStatementDto });
    return this.accessibilityStatementRepository.save(aStatement);
  }

  calculateFlag(acessibilityStatementDto: AccessibilityStatementDto) {
    const conformance = acessibilityStatementDto.conformance;
    const date = acessibilityStatementDto.statementDate;
    const hasAutoEval = acessibilityStatementDto.autoList.length > 0;
    const hasManualEval = acessibilityStatementDto.manualList.length > 0;
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

  findLatestByWebsiteID(WebsiteId: number) {
    return this.accessibilityStatementRepository.findOne({ where: { Website: { WebsiteId } }, relations: ["manualEvaluationList", "automaticEvaluationList", "userEvaluationList", "Website"], order: { statementDate: "ASC" } });
  }

  findByWebsiteName(Name: string) {
    return this.accessibilityStatementRepository.findOne({ where: { Website: { Name } }, relations: ["manualEvaluationList", "automaticEvaluationList", "userEvaluationList", "Website"] });
  }

  findById(Id: number): any {
    return this.accessibilityStatementRepository.findOne({ where: { Id }, relations: ["manualEvaluationList", "automaticEvaluationList", "userEvaluationList", "Website"] });
  }
  deleteById(Id:number){
    return this.accessibilityStatementRepository.delete({Id});
  }

  async getASList() {
    const list = await this.accessibilityStatementRepository.find({ relations: ["manualEvaluationList", "automaticEvaluationList", "userEvaluationList", "Website"] });
    const convertList = list.map((elem: any) => {
      elem.Website = elem.Website.Name;
      elem.manualEvaluationList = elem.manualEvaluationList.length;
      elem.automaticEvaluationList = elem.automaticEvaluationList.length;
      elem.userEvaluationList = elem.userEvaluationList.length;
      return elem;
    });
    return convertList;
  }
}
