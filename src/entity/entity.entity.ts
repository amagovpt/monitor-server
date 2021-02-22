import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Website } from "../website/website.entity";

@Entity("Entity")
export class EntityTable {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  EntityId: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
    unique: true,
  })
  Short_Name: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
    unique: true,
  })
  Long_Name: string;

  @Column({
    type: "datetime",
    nullable: false,
  })
  Creation_Date: any;

  @ManyToMany((type) => Website)
  @JoinTable()
  Websites: Website[];
}
