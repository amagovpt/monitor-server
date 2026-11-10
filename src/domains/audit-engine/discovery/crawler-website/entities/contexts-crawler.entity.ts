import { Context } from 'src/domains/inventory/context/context.entity';
import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CrawlerWebsite } from './crawler-website.entity';

@Entity('crawler_websites_contexts')
export class CrawlerContext {
  @PrimaryColumn({ name: 'context_id', type: 'int' })
  contextId: number;

  @PrimaryColumn({ name: 'crawler_id', type: 'int' })
  crawlerId: number;

  @ManyToOne(() => CrawlerWebsite, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'crawler_id' })
  crawler: CrawlerWebsite;

  @ManyToOne(() => Context, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'context_id' })
  context: Context;
}
