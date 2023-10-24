import { Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

@Entity({name:"website_criteria_notes"})
export class WebsiteCriteriaNotes {

  @PrimaryGeneratedColumn({
    type: 'int'
  })
  id: number;

  @Column({
    type: 'int',
    name:'website_id',
    nullable: false
  })
  websiteId: number;

  @Column({
    type: 'int',
    name:'sub_criteria_id',
    nullable: false
  })
  subCriteriaId: number;

  @Column({
    type: 'text',
    nullable: false,
  })
  note: string;

  @Column({
    type: 'int',
    nullable: false
  })
  conformity: number;
}
