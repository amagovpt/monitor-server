import {
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository} from "typeorm";
import { Criteria } from "./entities/criteria.entity";
import { SubCriteria } from "./entities/sub-criteria.entity";
import { WebsiteCriteriaNotes } from "./entities/website-criteria-notes.entity";
import { CriteriaFindAllDTO } from "./dto/criteria-find-all.dto";

@Injectable()
export class CriticalAspectService {
  constructor(
    @InjectRepository(Criteria)
    private readonly criteriaRepository: Repository<Criteria>,
    @InjectRepository(SubCriteria)
    private readonly subCriteriaRepository: Repository<SubCriteria>,
    @InjectRepository(WebsiteCriteriaNotes)
    private readonly webSiteCriteriaNotesRepository: Repository<WebsiteCriteriaNotes>,
   ) { }
  
  async findAllByWebsite(websiteId:number): Promise<CriteriaFindAllDTO> {
    let dto: CriteriaFindAllDTO = new CriteriaFindAllDTO();
    dto.criteria  = await this.criteriaRepository
    .createQueryBuilder('criteria')
    .leftJoinAndSelect('criteria.subCriteria', 'SubCriteria')
    .getMany();
    dto.notes = await this.webSiteCriteriaNotesRepository.createQueryBuilder('wcn')
    .where('wcn.websiteId = :websiteId',{websiteId}).getMany();
    return dto;
}

async saveNotes(webSiteCriteriaNotes :WebsiteCriteriaNotes[]){
  return await this.webSiteCriteriaNotesRepository.save(webSiteCriteriaNotes);
}

}
