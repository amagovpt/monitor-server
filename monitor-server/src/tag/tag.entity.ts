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
    type: "int",
  })
  TagId: number;

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
    type: "datetime",
    nullable: false,
  })
  Creation_Date: any;

  @ManyToMany((type) => Directory)
  @JoinTable()
  Directories: Directory[];

  @ManyToMany((type) => Website, website => website.Tags)
  @JoinTable({
    name: "TagWebsite",
    joinColumns: [{ name: "TagId" }],
    inverseJoinColumns: [{ name: "WebsiteId" }]
  })
  Websites: Website[];
}
