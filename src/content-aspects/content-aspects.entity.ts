import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("ContentAspects")
export class ContentAspects {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  ContentAspectsId: number;
  
  @Column({
    type: "int",
    nullable: false,
  })
  WebsiteId: number;
    
  @Column({
    type: "datetime",
    nullable: false,
  })
  Date: Date;

  @Column({
    type: "double",
    nullable: false,
  })
  Conformance: number;

  @Column({
    type: "text",
    nullable: false,
  })
  Result: string;
}
