import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Wesbite')
export class Website {

  @PrimaryGeneratedColumn({
    type: 'int'
  })
  WebsiteId: number;

  @Column({
    type: 'int',
    nullable: true
  })
  EntityId: number;

  @Column({
    type: 'int',
    nullable: true
  })
  UserId: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false
  })
  Name: string;

  @Column({
    type: 'datetime',
    nullable: false
  })
  Creation_Date: any;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0
  })
  Deleted: number;
}