import { GovUser } from 'src/gov-user/entities/gov-user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';

@Entity('User')
export class User {

  @PrimaryGeneratedColumn({
    type: 'int'
  })
  UserId: number;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false
  })
  Username: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false
  })
  Password: string;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: false
  })
  Type: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  Names: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  Emails: string;

  @Column({
    type: 'datetime',
    nullable: false
  })
  Register_Date: any;

  @Column({
    type: 'datetime',
    nullable: true
  })
  Last_Login: any;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false
  })
  Unique_Hash: string;

  @ManyToMany((type) => GovUser, (govUser) => govUser.entities)
  govUsers: User[];
}