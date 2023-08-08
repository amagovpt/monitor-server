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
    name:"WebsiteId",
    type: "int",
  })
  websiteId: number;

  @Column({
    name: "UserId",
    type: "int",
    nullable: true,
  })
  userId: number;

  @Column({
    name: "Name",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    name: "StartingUrl",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  startingUrl: string;

  @Column({
    name: "Declaration",
    type: "int",
    nullable: true,
  })
  declaration: number;

  @Column({
    name: "Declaration_Update_Date",
    type: "datetime",
    nullable: true,
  })
  declarationUpdateDate: any;

  @Column({
    name: "Stamp",
    type: "int",
    nullable: true,
  })
  stamp: number;

  @Column({
    name:"Stamp_Update_Date",
    type: "datetime",
    nullable: true,
  })
  stampUpdateDate: any;

  @Column({
    name: "Creation_Date",
    type: "datetime",
    nullable: false,
  })
  creationDate: any;

  @ManyToMany((type) => Tag,tag=>tag.websites)
  tags: Tag[];

  @ManyToMany((type) => EntityTable)
  @JoinTable()
  entities: EntityTable[];
}
