import { Controller, Get } from "@nestjs/common";
import { PageService } from "../page/page.service";
import { success } from "../lib/response";
import clone from "lodash.clone";

import { ListTags } from "./models/list-tags";
import { Tag } from "./models/tag";
import { Website } from "./models/website";

@Controller("observatory")
export class ObservatoryController {
  constructor(private readonly pageService: PageService) {}

  @Get()
  async getData(): Promise<any> {
    const data = await this.pageService.getObservatoryData();

    /*const tags = new Array<Tag>();
    const tmpTags = this.createTemporaryTags(data);

    for (const tag of tmpTags || []) {
      const newTag = this.createTag(tag, clone(data));
      tags.push(newTag);
    }

    const listTags = new ListTags(tags);
    //console.log(listTags);*/
    return success(data);
  }

  private createTemporaryTags(data: any): Array<any> {
    const tmpTagsIds = new Array<number>();
    const tmpTags = new Array<any>();
    data.map((tag: any) => {
      if (!tmpTagsIds.includes(tag.TagId)) {
        tmpTagsIds.push(tag.TagId);
        tmpTags.push({
          id: tag.TagId,
          name: tag.Tag_Name,
          creation_date: tag.Tag_Creation_Date,
        });
      }
    });

    return tmpTags;
  }

  private createTag(tag: any, data: any): Tag {
    const newTag = new Tag(tag.id, tag.name, tag.creation_date);
    const tmpWebsitesIds = new Array<number>();
    const websites = new Array<any>();
    for (const wb of data || []) {
      if (wb.TagId === tag.id && !tmpWebsitesIds.includes(wb.WebsiteId)) {
        tmpWebsitesIds.push(wb.WebsiteId);
        websites.push({
          id: wb.WebsiteId,
          entity: wb.Entity_Name,
          name: wb.Website_Name,
          domain: wb.Url,
          creation_date: wb.Website_Creation_Date,
        });
      }
    }

    for (const website of websites || []) {
      const newWebsite = this.createWebsite(website, tag, data);
      newTag.addWebsite(newWebsite);
    }

    return newTag;
  }

  private createWebsite(website: any, tag: any, data: any): Website {
    const newWebsite = new Website(
      website.id,
      website.entity,
      website.name,
      website.domain,
      website.creation_date
    );

    const pages = new Array<any>();
    data.map((p: any) => {
      if (p.Website_Name === website.name && p.TagId === tag.id) {
        pages.push({
          pageId: p.PageId,
          uri: p.Uri,
          creation_date: p.Page_Creation_Date,
          evaluationId: p.EvaluationId,
          title: p.Title,
          score: parseFloat(p.Score),
          errors: p.Errors,
          tot: p.Tot,
          A: p.A,
          AA: p.AA,
          AAA: p.AAA,
          evaluation_date: p.Evaluation_Date,
        });
      }
    });

    for (const page of pages || []) {
      this.addPageToWebsite(newWebsite, page);
    }

    return newWebsite;
  }

  private addPageToWebsite(website: any, page: any): void {
    website.addPage(
      page.pageId,
      page.uri,
      page.creation_date,
      page.evaluationId,
      page.title,
      page.score,
      page.errors,
      page.tot,
      page.A,
      page.AA,
      page.AAA,
      page.evaluation_date
    );
  }
}
