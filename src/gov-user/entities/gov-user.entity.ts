import { User } from "src/user/user.entity";
import {
  Column,
  Entity,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
} from "typeorm";
//Utilizador do Autenticação.gov
@Entity({ name: "GovUser" })
export class GovUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100, nullable: false })
  name: string;

  @Column({ type: "varchar", nullable: true })
  ccNumber: string;

  @ManyToMany((type) => User, (user) => user.govUsers)
  @JoinTable({
    name: "UserGovUser",
    inverseJoinColumn: { name: "UserId" },
    joinColumn: { name: "GovUserId" },
  })
  entities: User[];

  @Column({
    type: "datetime",
    nullable: false,
  })
  registerDate: Date;

  @Column({
    type: "datetime",
    nullable: false,
  })
  lastLogin: Date;
}
