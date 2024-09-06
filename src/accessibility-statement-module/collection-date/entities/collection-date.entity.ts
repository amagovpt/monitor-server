import { Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity("Collection_Date")
export class CollectionDate {
  @PrimaryGeneratedColumn({ name: "Id" })
  id: number;

  @CreateDateColumn({ name: "CreatedAt" })
  createdAt: Date;
}
