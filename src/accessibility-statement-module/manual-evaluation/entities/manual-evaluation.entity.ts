import { AccessibilityStatement } from "src/accessibility-statement-module/accessibility-statement/entities/accessibility-statement.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
@Entity("Manual_Evaluation")
export class ManualEvaluation {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  Title: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  Url: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  Sample: string;

  @Column({
    type: "int",
    nullable: true,
  })
  HeuristicsPassed: number;

  @Column({
    type: "int",
    nullable: true,
  })
  HeuristicsTotal: number;

  @Column({
    type: "text",
    nullable: true,
  })
  Summary: string;

  @Column({
    type: "datetime",
    nullable: true,
  })
  Date: any;

  @ManyToOne(
    (type) => AccessibilityStatement,
    (accessibilityStatement) => accessibilityStatement.manualEvaluationList
  )
  @JoinColumn({ name: "Accessibility_Statement_Id" })
  accessibilityStatement: AccessibilityStatement;
}
