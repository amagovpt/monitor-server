import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinTable,
  ManyToMany,
} from "typeorm";
import { Tag } from "../tag/tag.entity";
import { EntityTable } from "../entity/entity.entity";

@Entity("Website")
export class Website {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  WebsiteId: number;

  @Column({
    type: "int",
    nullable: true,
  })
  UserId: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  Name: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  StartingUrl: string;

  @Column({
    type: "int",
    nullable: true,
  })
  Declaration: number;

  @Column({
    type: "datetime",
    nullable: true,
  })
  Declaration_Update_Date: any;

  @Column({
    type: "int",
    nullable: true,
  })
  Stamp: number;

  @Column({
    type: "datetime",
    nullable: true,
  })
  Stamp_Update_Date: any;

  @Column({
    type: "datetime",
    nullable: false,
  })
  Creation_Date: any;

  @ManyToMany((type) => Tag,tag=>tag.Websites)
  tags: Tag[];

  @ManyToMany((type) => EntityTable)
  @JoinTable()
  entities: EntityTable[];
}
