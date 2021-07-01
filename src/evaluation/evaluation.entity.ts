import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Evaluation')
export class Evaluation {

  @PrimaryGeneratedColumn({
    type: 'int'
  })
  EvaluationId: number;

  @Column({
    type: 'int',
    nullable: false
  })
  PageId: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  Title: string;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: false
  })
  Score: string;

  @Column({
    type: 'mediumtext',
    nullable: false
  })
  Pagecode: string;

  @Column({
    type: 'text',
    nullable: false
  })
  Tot: string;

  @Column({
    type: 'mediumtext',
    nullable: false
  })
  Nodes: string;

  @Column({
    type: 'text',
    nullable: false
  })
  Errors: string;

  @Column({
    type: 'int',
    nullable: false
  })
  A: number;

  @Column({
    type: 'int',
    nullable: false
  })
  AA: number;

  @Column({
    type: 'int',
    nullable: false
  })
  AAA: number;

  @Column({
    type: 'datetime',
    nullable: false
  })
  Evaluation_Date: any;

  @Column({
    type: 'varchar',
    length: 2,
    nullable: false
  })
  Show_To: string;

  @Column({
    type: 'int',
    nullable: true
  })
  StudyUserId: number;

  @Column({
    type: 'text',
    nullable: false

  })
  Element_Count:string ;
  @Column({
    type: 'text',
    nullable: false

  })
  Tag_Count:string ;
}