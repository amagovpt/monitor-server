import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AuthGuard } from "@nestjs/passport";
import { WebsiteModule } from "src/website/website.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { readFileSync } from "fs";

describe("WebsiteController (e2e)", () => {
  let app: INestApplication;
  const CREATE_WEBSITE = "/website/create"; //post
  const UPDATE_WEBSITE = "/website/update"; //post
  const DELETE_BULK_WEBSITE = "/website/deleteBulk"; //post
  const REEVALUTE_WEBSITE = "/website/reEvaluate"; //post
  const UPDATE_OBSERVATORY_PAGES_WEBSITE = "/website/pages/updateObservatory"; //post
  const DELETE_WEBSITE = "/website/"; //delete :id
  const MYMONITOR_WEBSITE_DOMANIN = "/website/myMonitor/url/"; //get :website
  const DELETE_PAGES_WEBSITE = "/website/pages/deleteBulk"; // post
  const IMPORT_WEBSITE = "website/import"; //post
  const ADMIN_COUNT_WEBSITE = "website/all/count/"; //get :search
  const ADMIN_ALL_WEBSITES = "website/all/"; //get :size/:page/:sort/:diretion/:search
  const WEBSITE_INFO = "website/info/"; //get :websiteId
  const WEBSITE_USER_NAME = "website/"; //get :website/user/:user/pages
  const WEBSITE_CSV = "website/csv"; //get
  const PAGES_WEBSITE = "website/pages/"; //get :websiteId
  const OFICIAL_WEBSITE = "website/oficial"; //get
  const WITHOUT_USER_WEBSITE = "website/withoutUser"; //get
  const WITHOUT_ENTITY_WEBSITE = "website/withoutEntity"; //get
  const STUDY_MONITOR_TOTAL_WEBSITES = "website/studyMonitor/total"; //get
  const MY_MONITOR_TOTAL_WEBSITES = "website/myMonitor/total"; //get
  const OBSERVATORY_TOTAL_WEBSITES = "website/observatory/total"; //get
  const WEBSITE_EXISTS_NAME = "website/exists"; //get :name
  const WEBSITE_EXISTS_URL = "website/exists/url"; //get :url
  const WEBSITE_IN_OBSERVATORY = "website/isInObservatory"; //post
  const WEBSITE_TRANSFER_OBSERVATORY = "website/tranferObservatoryPages"; //post
  const WEBSITE_MY_MONITOR = "website/myMonitor"; //get
  const WEBSITE_MY_MONITOR_REEVALUATE = "website/myMonitor/reEvalute"; //post
  const WEBSITE_STUDY_MONITOR_REEVALUATE = "website/studyMonitor/reEvalute"; //post
  const WEBSITE_TAG = "website/studyMonitor/tag/"; //get :tag
  const WEBSITE_OTHER_TAG = "website/studyMonitor/otherTags/"; //get :tag
  const WEBSITE_TAG_EXISTS_NAME = "website/studyMonitor/tag/"; //get :tag/website/nameExists/:website
  const WEBSITE_TAG_EXISTS_URL = "website/studyMonitor/tag/"; //get :tag/websiteExists/:startingUrl
  const WEBSITE_STUDY_MONITOR_LINK = "website/studyMonitor/link"; //post
  const WEBSITE_STUDY_MONITOR_CREATE = "website/studyMonitor/create"; //post
  const WEBSITE_STUDY_MONITOR_REMOVE = "website/studyMonitor/remove"; //post

  const databaseConfig = JSON.parse(
    readFileSync("../monitor_db.json").toString()
  );

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        WebsiteModule,
        TypeOrmModule.forRoot({
          type: "mysql",
          host: databaseConfig.host,
          port: 3306,
          username: databaseConfig.user,
          password: databaseConfig.password,
          database: "testDB",
          entities: [__dirname + "/**/*.entity{.ts,.js}"],
          synchronize: true,
        }),
      ],
    })
      .overrideGuard(AuthGuard("jwt-admin"))
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard("jwt-monitor"))
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard("jwt-study"))
      .useValue({ canActivate: () => true })
      .compile();
    /**
     * https://medium.com/@salmon.3e/integration-testing-with-nestjs-and-typeorm-2ac3f77e7628
     */

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("/POST" + CREATE_WEBSITE, async () => {
    const createWebsiteDto = {
      userId: 1,
      name: "Sapo",
      startingUrl: "https://www.sapo.pt/",
      entities: [],
      tags: [],
    };
    const website = await request(app.getHttpServer())
      .post(CREATE_WEBSITE)
      .send(createWebsiteDto)
      .expect(200);

    const websiteInfo = await request(app.getHttpServer())
      .get(WEBSITE_INFO + website.id)
      .send(createWebsiteDto)
      .expect(200);
  });

  it("/POST" + CREATE_WEBSITE, async () => {
    const createWebsiteDto = {
      userId: 1,
      name: "Acessibilidade",
      startingUrl: "https://www.acessibilidade.gov.pt/",
      entities: [],
      tags: [],
    };
    const website = await request(app.getHttpServer())
      .post(CREATE_WEBSITE)
      .send(createWebsiteDto)
      .expect(200);
  });
});
