import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("Observatory")
export class Observatory {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  ObservatoryId: number;

  @Column({
    type: "mediumtext",
    nullable: false,
  })
  Global_Statistics: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  Type: string;

  @Column({
    type: "datetime",
    nullable: false,
  })
  Creation_Date: any;
}
