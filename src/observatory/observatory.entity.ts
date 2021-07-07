import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Observatory')
export class Observatory {

  @PrimaryGeneratedColumn({
    type: 'int'
  })
  ObservatoryId: number;
}