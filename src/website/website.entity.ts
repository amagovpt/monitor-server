import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinTable,
  ManyToMany,
  OneToMany
} from "typeorm";
import { Tag } from "../tag/tag.entity";
import { EntityTable } from "../entity/entity.entity";
import { Page } from "src/page/page.entity";
import { AccessibilityStatement } from "src/accessibility-statement-module/accessibility-statement/entities/accessibility-statement.entity";

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
  Tags: Tag[];

  @ManyToMany((type) => EntityTable)
  @JoinTable()
  Entities: EntityTable[];
  
  @JoinTable({
    name: 'WebsitePage',
    joinColumn: { name: 'WebsiteId' },
    inverseJoinColumn: { name: 'PageId' }
  })
  @ManyToMany((type) => Page, (page) => page.Pages)
  Pages: Page[];

  @OneToMany(type => AccessibilityStatement, (as) => as.Website)
  AStatements: AccessibilityStatement[];
}
