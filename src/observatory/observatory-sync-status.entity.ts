import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum SyncStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  INTERRUPTED = 'interrupted'
}

export enum SyncType {
  AUTO = 'auto',
  MANUAL = 'manual'
}

@Entity('ObservatorySyncStatus')
export class ObservatorySyncStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.IDLE
  })
  status: SyncStatus;

  @Column({
    type: 'enum',
    enum: SyncType,
    default: SyncType.AUTO
  })
  type: SyncType;

  @Column({ type: 'datetime', nullable: true })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true })
  endTime: Date;

  @Column({ type: 'int', default: 0 })
  totalChunks: number;

  @Column({ type: 'int', default: 0 })
  processedChunks: number;

  @Column({ type: 'int', default: 0 })
  totalDirectories: number;

  @Column({ type: 'int', default: 0 })
  processedDirectories: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  processId: string; // PM2 process identifier

  @Column({ type: 'varchar', length: 50, nullable: true })
  namespace: string;

  @Column({ type: 'int', nullable: true })
  amsid: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Calculated field for progress percentage
  get progressPercentage(): number {
    if (this.totalDirectories === 0) return 0;
    return Math.round((this.processedDirectories / this.totalDirectories) * 100);
  }

  // Calculated field for estimated time remaining
  get estimatedTimeRemaining(): number | null {
    if (this.status !== SyncStatus.RUNNING || this.processedDirectories === 0) return null;
    
    const elapsed = new Date().getTime() - this.startTime.getTime();
    const avgTimePerDirectory = elapsed / this.processedDirectories;
    const remainingDirectories = this.totalDirectories - this.processedDirectories;
    
    return Math.round(avgTimePerDirectory * remainingDirectories / 1000); // in seconds
  }
}