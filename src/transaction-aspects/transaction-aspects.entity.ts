import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("TransactionAspects")
export class TransactionAspects {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  TransactionAspectsId: number;
  
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
