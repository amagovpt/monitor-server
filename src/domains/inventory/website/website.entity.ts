import {
  Entity,
  Column,
  JoinTable,
  ManyToMany,
  BeforeUpdate,
  BeforeInsert,
  Index,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Auditable } from 'src/common/interfaces/auditable.interface';
import { IdentifiableModel } from 'src/common/interfaces/Identifiable.interface';
import { Context } from '../context/context.entity';
import { User } from 'src/domains/identity/user/user.entity';
import { Institution } from '../institution/institution.entity';

@Entity('websites')
@Index('idx_websites_title_trgm', { synchronize: false })
@Index('idx_websites_base_url', ['baseUrl'], { unique: true })
export class Website implements IdentifiableModel, Auditable {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ name: 'base_url', type: 'varchar', unique: true, length: 255, nullable: false })
  baseUrl: string;

  @ManyToMany(() => Context)
  @JoinTable({
    name: 'website_contexts',
    joinColumn: { name: 'website_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'context_id', referencedColumnName: 'id' },
  })
  contexts: Context[];

  @ManyToOne(() => Institution, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'institution_id' })
  institution: Institution | null;

  @Column({ name: 'institution_id', type: 'int', unsigned: true, nullable: true })
  institutionId: number | null;

  @Column({ name: 'is_in_observatory', type: 'boolean', default: false })
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

  @Index()
  @Column({ name: 'created_by_id', type: 'int', unsigned: true, nullable: true })
  createdById: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Index()
  @Column({ name: 'updated_by_id', type: 'int', unsigned: true, nullable: true })
  updatedById: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: User | null;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeBaseUrl() {
    if (this.baseUrl) {
      this.baseUrl = this.baseUrl.trim().toLowerCase().replace(/\/+$/, '');
    }
  }
}
