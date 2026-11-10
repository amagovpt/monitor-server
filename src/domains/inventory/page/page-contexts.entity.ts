import { Context } from 'src/domains/inventory/context/context.entity';
import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column, UpdateDateColumn } from 'typeorm';
import { Page } from './page.entity';

export enum PageStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  EVALUATED = 'EVALUATED',
  FAILED = 'FAILED',
}

@Entity('page_contexts')
export class PageContext {
  @PrimaryColumn({ name: 'context_id', type: 'integer' })
  contextId: number;

  @PrimaryColumn({ name: 'page_id', type: 'integer' })
  pageId: number;

  @ManyToOne(() => Page, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: Page;

  @ManyToOne(() => Context, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'context_id' })
  context: Context;

  @Column({
    type: 'enum',
    name: 'page_status',
    enum: PageStatus,
    enumName: 'page_status_enum',
    default: PageStatus.PENDING,
  })
  pageStatus: PageStatus;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
