import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Page')
export class Page {

  @PrimaryGeneratedColumn({
    name: "PageId",
    type: 'int'
  })
  pageId: number;

  @Column({
    name: "Uri",
    type: 'varchar',
    length: 255,
    nullable: false
  })
  uri: string;

  @Column({
    name: "Show_In",
    type: 'varchar',
    length: 3,
    nullable: false,
    default: '000'
  })
  showIn: string;

  @Column({
    name: "Creation_Date",
    type: 'datetime',
    nullable: false
  })
  creationDate: any;
}