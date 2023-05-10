import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '@nestjs/passport';

describe('WebsiteController (e2e)', () => {
  let app: INestApplication;
  const CREATE_WEBSITE = '/website/create';//post
  const UPDATE_WEBSITE = '/website/update';//post
  const DELETE_BULK_WEBSITE = '/website/deleteBulk';//post
  const REEVALUTE_WEBSITE = '/website/reEvaluate';//post
  const UPDATE_OBSERVATORY_PAGES_WEBSITE = '/website/pages/updateObservatory';//post
  const DELETE_WEBSITE = '/website/';//delete :id
  const MYMONITOR_WEBSITE_DOMANIN = "/website/myMonitor/url/";//get :website
  const DELETE_PAGES_WEBSITE = "/website/pages/deleteBulk";// post
  const IMPORT_WEBSITE = "website/import";//post
  const ADMIN_COUNT_WEBSITE = "website/all/count/"//get :search
  const ADMIN_ALL_WEBSITES = "website/all/"//get :size/:page/:sort/:diretion/:search
  const WEBSITE_INFO = "website/info/"//get :websiteId
  const WEBSITE_USER_NAME ="website/";//get :website/user/:user/pages
  const WEBSITE_CSV = "website/csv";//get
  const PAGES_WEBSITE = "website/pages/";//get :websiteId
  const OFICIAL_WEBSITE = "website/oficial";//get
  const WITHOUT_USER_WEBSITE = "website/withoutUser"//get
  const WITHOUT_ENTITY_WEBSITE = "website/withoutEntity"//get
  const STUDY_MONITOR_TOTAL_WEBSITES = "website/studyMonitor/total";//get
  const MY_MONITOR_TOTAL_WEBSITES = "website/myMonitor/total";//get
  const OBSERVATORY_TOTAL_WEBSITES = "website/observatory/total";//get
  const WEBSITE_EXISTS_NAME = "website/exists";//get :name
  const WEBSITE_EXISTS_URL = "website/exists/url";//get :url
  const WEBSITE_IN_OBSERVATORY = "website/isInObservatory";//post
  const WEBSITE_TRANSFER_OBSERVATORY = "website/tranferObservatoryPages";//post
  const WEBSITE_MY_MONITOR = "website/myMonitor";//get
  const WEBSITE_MY_MONITOR_REEVALUATE = "website/myMonitor/reEvalute";//post
  const WEBSITE_STUDY_MONITOR_REEVALUATE = "website/studyMonitor/reEvalute";//post
  const WEBSITE_TAG = "website/studyMonitor/tag/";//get :tag
  const WEBSITE_OTHER_TAG = "website/studyMonitor/otherTags/";//get :tag
  const WEBSITE_TAG_EXISTS_NAME = "website/studyMonitor/tag/";//get :tag/website/nameExists/:website
  const WEBSITE_TAG_EXISTS_URL = "website/studyMonitor/tag/";//get :tag/websiteExists/:startingUrl
  const WEBSITE_STUDY_MONITOR_LINK = "website/studyMonitor/link";//post
  const WEBSITE_STUDY_MONITOR_CREATE = "website/studyMonitor/create";//post
  const WEBSITE_STUDY_MONITOR_REMOVE = "website/studyMonitor/remove"//post



  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).overrideGuard(AuthGuard("jwt-admin"))
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard("jwt-monitor"))
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard("jwt-study"))
      .useValue({ canActivate: () => true }) 
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/POST'+CREATE_WEBSITE , () => {
    return request(app.getHttpServer())
      .post(CREATE_WEBSITE)
      .expect(200)
      .expect('Hello World!');
  });
});
