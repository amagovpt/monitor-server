import { Entity, Column, PrimaryGeneratedColumn,ManyToOne} from 'typeorm';
import { Criteria } from './criteria.entity';

@Entity('sub_criteria')
export class SubCriteria {

  @PrimaryGeneratedColumn({
    type: 'int'
  })
  id: number;
  @Column({
    type: 'int',
    nullable: false
  })
  criteriaId: number;
  @Column({
    type: 'int',
    nullable: false,
    name:'sub_position'
  })
  subPosition: number;

  @Column({
    type: 'text',
    nullable: false
  })
  title: string;

  @Column({
    type: 'text',
    nullable: false
  })
  content: string;

  @ManyToOne(type => Criteria)
  criteria: Criteria;
}
