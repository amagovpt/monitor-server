import {
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, LessThanOrEqual, Repository } from "typeorm";
import { Criteria } from "./entities/criteria.entity";
import { WebsiteCriteriaNotes } from "./entities/website-criteria-notes.entity";
import { WebSiteCriteriaNotesDTO } from "./dto/website-criteria-notes.dto";
import { ShareCode } from "./entities/share-code.entity";
import { ShareCodeDto } from "./dto/share-code.dto";
import { Website } from "src/website/website.entity";
import * as crypto from "crypto";
import { share } from "rxjs";
@Injectable()
export class ChecklistsService {
  constructor(
    @InjectRepository(ShareCode)
    private readonly shareCodeRepository: Repository<ShareCode>,
    @InjectRepository(WebsiteCriteriaNotes)
    private readonly webSiteCriteriaNotesRepository: Repository<WebsiteCriteriaNotes>,
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
  ) { }

  async findAllNotesByChecklistIdAndWebsiteId(checklistId: string, websiteId: number): Promise<WebSiteCriteriaNotesDTO[]> {
    return await this.webSiteCriteriaNotesRepository
      .createQueryBuilder('wcn')
      .where('wcn.websiteId = :websiteId and wcn.checklistId = :checklistId', { websiteId, checklistId })
      .getMany();
  }

  async saveNotes(webSiteCriteriaNotes: WebsiteCriteriaNotes[]) {
    return await this.webSiteCriteriaNotesRepository.save(webSiteCriteriaNotes);
  }

  async countConformNotes(websiteId: number) {
    return await this.webSiteCriteriaNotesRepository.count({
      where:
        [
          { conformity: 1, websiteId: websiteId },
          { conformity: 2, websiteId: websiteId }
        ]
    }
    )
  }
  async generateShareCode(shareCode: ShareCodeDto): Promise<ShareCodeDto> {
    //For some reason, findOne doesn't accept class.atribute, so i had to create a var
    console.log(shareCode);
    let websiteData: string | number = shareCode.websiteData;
    let website = await this.websiteRepository.findOneBy({ WebsiteId: Number(websiteData) });
    if (!website) {
      throw new Error('Website Not Found');
    }
    websiteData = website.WebsiteId
    let checklistId = shareCode.checklistId;
    let persistedShareCode =
      await this.shareCodeRepository
        .createQueryBuilder('sc')
        .innerJoinAndSelect('sc.website', 'website')
        .where('website.WebsiteId', { websiteData })
        .andWhere('checklist_id', { checklistId })
        .getOne();

    if (persistedShareCode) {
      if(persistedShareCode.expiryDate < new Date()){
        persistedShareCode.shareCode = crypto.randomUUID().substring(0, 7);
      }
      persistedShareCode.expiryDate = new Date(new Date().getDate() + 30);
      return new ShareCodeDto(persistedShareCode.website.Name,
        persistedShareCode.checklistId,
        persistedShareCode.shareCode);
    }

    let newShareCode: ShareCode =
      new ShareCode(checklistId, website, crypto.randomUUID().substring(0, 7));
    await this.shareCodeRepository.save(newShareCode);
    return new ShareCodeDto(newShareCode.website.Name,
      newShareCode.checklistId,
      newShareCode.shareCode)
  }

  async validadeShareCode(shareCode: ShareCodeDto){
  let website = await this.websiteRepository.findOneBy({ Name: shareCode.websiteData.toString()});
  if (!website) {
    throw new Error('Website Not Found');
  }
  let websiteData = website.WebsiteId;
  let checklistId = shareCode.checklistId;
  let sharedCode = shareCode.shareCode;
  let persistedShareCode =
  await this.shareCodeRepository
    .createQueryBuilder('sc')
    .innerJoinAndSelect('sc.website', 'website')
    .where('website.WebsiteId', { websiteData })
    .andWhere('checklist_id', { checklistId })
    .andWhere('share_chode',{sharedCode})
    .andWhere('expiry_date',LessThanOrEqual(new Date()))
    .getOne();
    return !!persistedShareCode;
  }
}
