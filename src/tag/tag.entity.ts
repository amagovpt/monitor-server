import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Tag')
export class Tag {

  @PrimaryGeneratedColumn({
    type: 'int'
  })
  TagId: number;

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
    type: 'tinyint',
    width: 1,
    nullable: false
  })
  Show_In_Observatorio: number;

  @Column({
    type: 'datetime',
    nullable: false
  })
  Creation_Date: any;
}