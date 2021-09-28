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
  CrawlDomainId: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  Uri: string;
}

@Entity("CrawlDomain")
export class CrawlDomain {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  CrawlDomainId: number;

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
  DomainUri: string;

  @Column({
    type: "int",
    nullable: false,
  })
  DomainId: number;

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
    type: "varchar",
    length: 255,
    nullable: false,
  })
  SubDomainUri: string;

  @Column({
    type: "tinyint",
    width: 1,
    nullable: false,
  })
  Tag: number;
}
