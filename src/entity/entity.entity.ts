import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Entity')
export class EntityTable {

  @PrimaryGeneratedColumn({
    type: 'int'
  })
  EntityId: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true
  })
  Short_Name: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true
  })
  Long_Name: string;

  @Column({
    type: 'datetime',
    nullable: false
  })
  Creation_Date: any;
}