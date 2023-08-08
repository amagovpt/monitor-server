import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("Observatory")
export class Observatory {
  @PrimaryGeneratedColumn({
    name: "ObservatoryId",
    type: "int",
  })
  observatoryId: number;

  @Column({
    name: "Global_Statistics",
    type: "mediumtext",
    nullable: false,
  })
  globalStatistics: string;

  @Column({
    name: "Type",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  type: string;

  @Column({
    name: "Creation_Date",
    type: "datetime",
    nullable: false,
  })
  creationDate: any;
}
