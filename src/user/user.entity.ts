import { GovUser } from 'src/gov-user/entities/gov-user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';

@Entity('User')
export class User {

  @PrimaryGeneratedColumn({
    name: "UserId",
    type: 'int'
  })
  userId: number;

  @Column({
    name: "Username",
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false
  })
  username: string;

  @Column({
    name: "Password",
    type: 'varchar',
    length: 255,
    nullable: false
  })
  password: string;

  @Column({
    name: "Type",
    type: 'varchar',
    length: 45,
    nullable: false
  })
  type: string;

  @Column({
    name: "Names",
    type: 'varchar',
    length: 255,
    nullable: true
  })
  names: string;

  @Column({
    name: "Emails",
    type: 'varchar',
    length: 255,
    nullable: true
  })
  emails: string;

  @Column({
    name: "Register_Date",
    type: 'datetime',
    nullable: false
  })
  registerDate: any;

  @Column({
    name: "Last_Login",
    type: 'datetime',
    nullable: true
  })
  lastLogin: any;

  @Column({
    name: "Unique_Hash",
    type: 'varchar',
    length: 255,
    nullable: false
  })
  uniqueHash: string;

  @ManyToMany((type) => GovUser, (govUser) => govUser.entities)
  govUsers: User[];
}