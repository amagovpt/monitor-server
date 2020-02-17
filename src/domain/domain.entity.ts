import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Domain')
export class Domain {

  @PrimaryGeneratedColumn({
    type: 'int'
  })
  DomainId: number;

  @Column({
    type: 'int',
    nullable: false
  })
  WebsiteId: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false
  })
  Url: string;

  @Column({
    type: 'datetime',
    nullable: false
  })
  Start_Date: any;

  @Column({
    type: 'datetime',
    nullable: true
  })
  End_Date: any;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1
  })
  Active: number;
}