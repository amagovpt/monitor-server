import { Website } from '../website/website.entity';
import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Auditable } from 'src/common/interfaces/auditable.interface';
import { IdentifiableModel } from 'src/common/interfaces/Identifiable.interface';
import { User } from 'src/domains/identity/user/user.entity';
import { SoftDeletable } from 'src/common/interfaces/soft-deletable.interface';

@Entity('pages')
@Index('idx_pages_url_trgm', { synchronize: false })
@Index('uq_pages_site_url_hash', ['websiteId', 'urlHash'], { unique: true })
export class Page implements IdentifiableModel, Auditable, SoftDeletable {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ type: 'text', nullable: false })
  url: string;

  @ManyToOne(() => Website, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'website_id' })
  website: Website;

  @Column({ name: 'website_id', type: 'int', unsigned: true, nullable: false })
  websiteId: number;

  @Column({ name: 'url_hash', type: 'bigint', nullable: false })
  urlHash: string;

  @Column({
    type: 'boolean',
    nullable: true,
    name: 'is_in_observatory',
    default: false,
  })
  isInObservatory: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ name: 'created_by_id', type: 'int', unsigned: true, nullable: true })
  createdById: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'updated_by_id', type: 'int', unsigned: true, nullable: true })
  updatedById: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: User | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by_id', type: 'int', unsigned: true, nullable: true })
  deletedById: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deleted_by_id' })
  deletedBy: User | null;
}
