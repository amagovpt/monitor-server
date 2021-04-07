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
    type: "int",
  })
  DirectoryId: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  Name: string;

  @Column({
    type: "tinyint",
    width: 1,
    nullable: false,
  })
  Show_in_Observatory: number;

  @Column({
    type: "tinyint",
    width: 1,
    nullable: false,
  })
  Method: number;

  @Column({
    type: "datetime",
    nullable: false,
  })
  Creation_Date: any;

  @ManyToMany((type) => Tag)
  @JoinTable()
  Tags: Tag[];
}
