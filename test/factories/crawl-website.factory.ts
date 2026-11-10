import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import {
  CrawlerWebsite,
  CrawlerStatus,
} from 'src/domains/audit-engine/discovery/crawler-website/entities/crawler-website.entity';

export const crawlWebsiteFactory = Factory.define<CrawlerWebsite>(
  ({ sequence, transientParams, onCreate }) => {
    onCreate(async (website) => {
      return website;
    });

    return {
      id: sequence,
      baseUrl: faker.internet.url(),
      websiteId: transientParams.websiteId || 1,
      website: transientParams.website || null,
      maxDepth: faker.number.int({ min: 1, max: 10 }),
      status: CrawlerStatus.PENDING,
      createdById: transientParams.createdById || faker.number.int({ min: 1, max: 100 }),
      createdBy: transientParams.createdBy || null,
      updatedById: null,
      updatedBy: null,
      pagesCount: 0,
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    } as CrawlerWebsite;
  },
);
