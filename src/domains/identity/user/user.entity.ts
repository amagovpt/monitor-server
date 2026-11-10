import { Role } from '../role/roles.entity';
import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SoftDeletable } from 'src/common/interfaces/soft-deletable.interface';
import { Auditable } from 'src/common/interfaces/auditable.interface';
import { IdentifiableModel } from 'src/common/interfaces/Identifiable.interface';

export enum PermissionLevel {
  MANAGER = 'manager',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

@Entity('users')
export class User implements IdentifiableModel, Auditable, SoftDeletable {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @ManyToOne(() => Role, { eager: true, nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id', type: 'int', unsigned: true, nullable: false })
  roleId: number;

  @Column({
    name: 'username',
    type: 'varchar',
    length: 150,
    unique: true,
    nullable: false,
  })
  username: string;

  @Column({
    name: 'password',
    type: 'varchar',
    length: 255,
    nullable: false,
    select: false,
  })
  password: string;

  @Column({
    name: 'last_login',
    type: 'timestamptz',
    nullable: true,
  })
  lastLogin?: Date;

  @Column({
    name: 'unique_hash',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  uniqueHash: string;

  @Column({
    name: 'cc_number',
    type: 'varchar',
    length: 30,
    unique: true,
    nullable: true,
  })
  ccNumber: string;

  @Column({
    name: 'permission',
    type: 'enum',
    enum: PermissionLevel,
    nullable: false,
    default: PermissionLevel.VIEWER,
  })
  permission: PermissionLevel;

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
  createdById: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Index()
  @Column({ name: 'updated_by_id', type: 'int', unsigned: true, nullable: true })
  updatedById: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: User | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @Column({ name: 'deleted_by', type: 'int', unsigned: true, nullable: true })
  deletedById: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deletedBy: User;
}
