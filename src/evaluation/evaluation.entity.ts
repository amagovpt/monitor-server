import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Evaluation')
export class Evaluation {

  @PrimaryGeneratedColumn({
    name: "EvaluationId",
    type: 'int'
  })
  evaluationId: number;

  @Column({
    name: "PageId",
    type: 'int',
    nullable: false
  })
  pageId: number;

  @Column({
    name: "Title",
    type: 'varchar',
    length: 255,
    nullable: true
  })
  title: string;

  @Column({
    name: "Score",
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: false
  })
  score: string;

  @Column({
    name: "Pagecode",
    type: 'mediumtext',
    nullable: false
  })
  pagecode: string;

  @Column({
    name: "Tot",
    type: 'text',
    nullable: false
  })
  tot: string;

  @Column({
    name: "Nodes",
    type: 'mediumtext',
    nullable: false
  })
  nodes: string;

  @Column({
    name: "Errors",
    type: 'text',
    nullable: false
  })
  errors: string;

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
    name: "Evaluation_Date",
    type: 'datetime',
    nullable: false
  })
  evaluationDate: any;

  @Column({
    name: "Show_To",
    type: 'varchar',
    length: 2,
    nullable: false
  })
  showTo: string;

  @Column({
    name: "StudyUserId",
    type: 'int',
    nullable: true
  })
  studyUserId: number;

  @Column({
    name: "Element_Count",
    type: 'text',
    nullable: false

  })
  elementCount:string ;
  @Column({
    name: "Tag_Count",
    type: 'text',
    nullable: false

  })
  tagCount:string ;
}