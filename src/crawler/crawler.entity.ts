import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("CrawlPage")
export class CrawlPage {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  CrawlId: number;

  @Column({
    type: "int",
    nullable: false,
  })
  CrawlWebsiteId: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  Uri: string;
}

@Entity("CrawlWebsite")
export class CrawlWebsite {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  CrawlWebsiteId: number;

  @Column({
    type: "int",
    nullable: false,
  })
  UserId: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  StartingUrl: string;

  @Column({
    type: "int",
    nullable: false,
  })
  WebsiteId: number;

  @Column({
    type: "int",
    nullable: false,
    default: 0,
  })
  Max_Depth: number;

  @Column({
    type: "int",
    nullable: false,
    default: 0,
  })
  Max_Pages: number;

  @Column({
    type: "tinyint",
    nullable: false,
    default: 0,
  })
  Wait_JS: number;

  @Column({
    type: "datetime",
    nullable: false,
  })
  Creation_Date: any;

  @Column({
    type: "tinyint",
    width: 1,
    nullable: false,
  })
  Done: number;

  @Column({
    type: "tinyint",
    width: 1,
    nullable: false,
  })
  Tag: number;
}
