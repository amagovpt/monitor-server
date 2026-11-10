import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column } from 'typeorm';

export enum EvaluationsQuarterStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('quarterly_evaluations_closure')
export class EvaluationsQuarterClosure {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date;

  @Column({ name: 'quarter', type: 'int', nullable: false })
  quarter: number = new Date().getMonth() / 3 + 1;

  @Column({ name: 'evaluations_processed', type: 'int', nullable: false })
  evaluationsProcessed: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EvaluationsQuarterStatus,
    nullable: false,
  })
  status: EvaluationsQuarterStatus = EvaluationsQuarterStatus.PENDING;

  @Column({ name: 'error_message', type: 'varchar', length: 255, nullable: true })
  errorMessage: string;
}
