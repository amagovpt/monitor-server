import { Injectable } from "@nestjs/common";
import { DirectoryService } from "./directory/directory.service";
import { TagService } from "./tag/tag.service";
import { EntityService } from "./entity/entity.service";
import { WebsiteService } from "./website/website.service";
import { PageService } from "./page/page.service";
import { UserService } from "./user/user.service";
import { GovUserService } from "./gov-user/gov-user.service";
import { ObservatoryService } from "./observatory/observatory.service";

@Injectable()
export class AppService {
  constructor(
    private readonly directoryService: DirectoryService,
    private readonly tagService: TagService,
    private readonly entityService: EntityService,
    private readonly websiteService: WebsiteService,
    private readonly pageService: PageService,
    private readonly userService: UserService,
    private readonly govUserService: GovUserService,
    private readonly observatoryService: ObservatoryService
  ) {}

  getHello(): string {
    return "Hello World!";
  }

  async getObservatoryStats(): Promise<any> {
    const [directories, tags, entities, websites, pages] = await Promise.all([
      this.directoryService.findNumberOfObservatory(),
      this.tagService.findNumberOfObservatory(),
      this.entityService.findNumberOfObservatory(),
      this.websiteService.findNumberOfObservatory(),
      this.pageService.findNumberOfObservatory()
    ]);

    return {
      directories,
      tags,
      entities,
      websites,
      pages
    };
  }

  async getTotalStats(): Promise<any> {
    const [
      directories,
      tags,
      entities,
      websites,
      pages,
      amsUsers,
      myMonitorUsers,
      studyMonitorUsers,
      govUsers
    ] = await Promise.all([
      this.directoryService.count(),
      this.tagService.count(),
      this.entityService.count(),
      this.websiteService.count(),
      this.pageService.count(),
      this.userService.findNumberOfAMS(),
      this.userService.findNumberOfMyMonitor(),
      this.userService.findNumberOfStudyMonitor(),
      this.govUserService.findTotal()
    ]);

    return {
      directories,
      tags,
      entities,
      websites,
      pages,
      users: amsUsers + myMonitorUsers + studyMonitorUsers,
      govUsers
    };
  }

  async getMyMonitorStats(): Promise<any> {
    const [users, websites, pages] = await Promise.all([
      this.userService.findNumberOfMyMonitor(),
      this.websiteService.findNumberOfMyMonitor(),
      this.pageService.findNumberOfMyMonitor()
    ]);

    return {
      users,
      websites,
      pages
    };
  }

  async getTotalsData(): Promise<any> {
    // Return observatory-format data but including ALL system data
    // (observatory + mymonitor + AMS-only data)
    return await this.observatoryService.buildTotalStatistics();
  }
}
