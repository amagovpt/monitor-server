import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("CrawlPage")
export class CrawlPage {
  @PrimaryGeneratedColumn({
    name: "CrawlId",
    type: "int",
  })
  crawlId: number;

  @Column({
    name: "CrawlWebsiteId",
    type: "int",
    nullable: false,
  })
  crawlWebsiteId: number;

  @Column({
    name: "Uri",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  uri: string;
}

@Entity("CrawlWebsite")
export class CrawlWebsite {
  @PrimaryGeneratedColumn({
    name: "CrawlWebsiteId",
    type: "int",
  })
  crawlWebsiteId: number;

  @Column({
    name: "UserId",
    type: "int",
    nullable: false,
  })
  userId: number;

  @Column({
    name: "StartingUrl",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  startingUrl: string;

  @Column({
    name: "WebsiteId",
    type: "int",
    nullable: false,
  })
  websiteId: number;

  @Column({
    name: "Max_Depth",
    type: "int",
    nullable: false,
    default: 0,
  })
  maxDepth: number;

  @Column({
    name: "Max_Pages",
    type: "int",
    nullable: false,
    default: 0,
  })
  maxPages: number;

  @Column({
    name: "Wait_JS",
    type: "tinyint",
    nullable: false,
    default: 0,
  })
  waitJS: number;

  @Column({
    name: "Creation_Date",
    type: "datetime",
    nullable: false,
  })
  creationDate: any;

  @Column({
    name: "Done",
    type: "tinyint",
    width: 1,
    nullable: false,
  })
  done: number;

  @Column({
    name: "Tag",
    type: "tinyint",
    width: 1,
    nullable: false,
  })
  tag: number;
}
