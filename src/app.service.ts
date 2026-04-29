import { Injectable, OnModuleInit } from "@nestjs/common";
import { DirectoryService } from "./directory/directory.service";
import { TagService } from "./tag/tag.service";
import { EntityService } from "./entity/entity.service";
import { WebsiteService } from "./website/website.service";
import { PageService } from "./page/page.service";
import { UserService } from "./user/user.service";
import { GovUserService } from "./gov-user/gov-user.service";
import { ObservatoryService } from "./observatory/observatory.service";
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';


@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger('Bootstrap');
  constructor(private configService: ConfigService,
    private readonly directoryService: DirectoryService,
    private readonly tagService: TagService,
    private readonly entityService: EntityService,
    private readonly websiteService: WebsiteService,
    private readonly pageService: PageService,
    private readonly userService: UserService,
    private readonly govUserService: GovUserService,
    private readonly observatoryService: ObservatoryService
  ) {}
  onModuleInit() {
    const nodeEnv = this.configService.get('NODE_ENV'); 
    const authMethod = this.configService.get('APP_AUTH_METHOD');
    const secretKey = this.configService.get('SECRET_KEY');
    const AuthServer = this.configService.get('AUTH_SERVER');
    const secretStatus = secretKey ? '✅ PRESENT' : '❌ MISSING';
    this.logger.log('┌──────────────────────────────────────────┐');
    this.logger.log('│          CONFIGURATION AUDIT             │');
    this.logger.log('├──────────────────────────────────────────┤');
    this.logger.log(`│ NODE_ENV    : ${nodeEnv.padEnd(26)} │`);
    this.logger.log(`│ AUTH_METHOD : ${authMethod.padEnd(26)} │`);
    this.logger.log(`│ SECRET_KEY  : ${secretStatus.padEnd(26)}│`);
    this.logger.log(`│ AUTH_SERVER : ${AuthServer.padEnd(26)} │`);
    this.logger.log('└──────────────────────────────────────────┘');
  }
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
    // Return new comprehensive structure including ALL system data
    // (observatory + mymonitor + AMS-only data)
    return await this.observatoryService.buildComprehensiveTotals();
  }

  async getTotalsPracticesData(): Promise<any> {
    // Return practice table data from all system data
    return await this.observatoryService.buildComprehensivePracticesData();
  }
}
