import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinTable,
  ManyToMany,
} from "typeorm";
import { Tag } from "../tag/tag.entity";

@Entity("Directory")
export class Directory {
  @PrimaryGeneratedColumn({
    name: "DirectoryId",
    type: "int",
  })
  directoryId: number;

  @Column({
    name: "Name",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    name: "Show_in_Observatory",
    type: "tinyint",
    width: 1,
    nullable: false,
  })
  showInObservatory: number;

  @Column({
    name: "Method",
    type: "tinyint",
    width: 1,
    nullable: false,
  })
  method: number;

  @Column({
    name: "Creation_Date",
    type: "datetime",
    nullable: false,
  })
  creationDate: any;

  @ManyToMany((type) => Tag)
  @JoinTable()
  tags: Tag[];
}
