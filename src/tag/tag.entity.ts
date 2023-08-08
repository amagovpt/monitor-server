import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinTable,
  ManyToMany,
} from "typeorm";
import { Directory } from "../directory/directory.entity";
import { Website } from "../website/website.entity";

@Entity("Tag")
export class Tag {
  @PrimaryGeneratedColumn({
    name: "TagId",
    type: "int",
  })
  tagId: number;

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
    name: "Creation_Date",
    type: "datetime",
    nullable: false,
  })
  creationDate: any;

  @ManyToMany((type) => Directory)
  @JoinTable()
  directories: Directory[];

  @ManyToMany((type) => Website, website => website.tags)
  @JoinTable({
    name: "TagWebsite",
    joinColumns: [{ name: "TagId" }],
    inverseJoinColumns: [{ name: "WebsiteId" }]
  })
  websites: Website[];
}
