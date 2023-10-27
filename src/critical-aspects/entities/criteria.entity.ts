import { Entity, Column, PrimaryGeneratedColumn,OneToMany} from 'typeorm';

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

}

