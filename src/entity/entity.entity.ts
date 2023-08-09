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
    name: "EntityId",
    type: "int",
  })
  entityId: number;

  @Column({
    name: "Short_Name",
    type: "varchar",
    length: 255,
    nullable: false,
    unique: true,
  })
  shortName: string;

  @Column({
    name: "Long_Name",
    type: "varchar",
    length: 255,
    nullable: false,
    unique: true,
  })
  longName: string;

  @Column({
    name: "Creation_Date",
    type: "datetime",
    nullable: false,
  })
  creationDate: any;

  @ManyToMany((type) => Website)
  @JoinTable()
  websites: Website[];
}
