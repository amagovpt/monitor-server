import { Entity, Column, PrimaryGeneratedColumn,OneToMany, JoinColumn} from 'typeorm';
import { SubCriteria } from './sub-criteria.entity';

@Entity('Criteria')
export class Criteria {

  @PrimaryGeneratedColumn({
    type: 'int'
  })
  id: number;

  @Column({
    type: 'text',
    nullable: false
  })
  title: string;

  @OneToMany(type => SubCriteria, (subCriteria) => subCriteria.criteria)
  subCriteria: SubCriteria[];
}

