import { AccessibilityStatement } from "src/accessibility-statement-module/accessibility-statement/entities/accessibility-statement.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("Contact")
export class Contact {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({
    type: "varchar",
    length: 255,
  })
  ContactType: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  Contact: string;

  @ManyToOne(
    (type) => AccessibilityStatement,
    (statement) => statement.contacts
  )
  @JoinColumn({ name: "Accessibility_Statement_Id" })
  acessiblityStatement: AccessibilityStatement;
}
