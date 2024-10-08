import { AutomaticEvaluation } from "src/accessibility-statement-module/automatic-evaluation/entities/automatic-evaluation.entity";
import { Contact } from "src/accessibility-statement-module/contact/entities/contact.entity";
import { ManualEvaluation } from "src/accessibility-statement-module/manual-evaluation/entities/manual-evaluation.entity";
import { Website } from "src/website/website.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Page } from "../../../page/page.entity";

import { UserEvaluation } from "../../user-evaluation/entities/user-evaluation.entity";
import { State } from "../state";
@Entity("Accessibility_Statement")
export class AccessibilityStatement {
  @PrimaryGeneratedColumn()
  Id: number;

  @CreateDateColumn()
  CreatedAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    onUpdate: new Date().toString(),
    nullable: true,
  })
  UpdatedAt: Date;

  @ManyToOne((type) => Website, (website) => website.AStatements)
  @JoinColumn({ name: "WebsiteId", referencedColumnName: "WebsiteId" })
  Website: Website;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  url: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  conformance: string;

  @Column({
    type: "text",
    nullable: false,
  })
  evidence: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  seal: string;

  @Column({
    type: "datetime",
    nullable: true,
  })
  statementDate: Date;

  @Column({ type: "enum", enum: State })
  state: State;

  @Column({ type: "varchar", length: 255 })
  hash: string;

  @OneToMany(
    (type) => ManualEvaluation,
    (evaluation) => evaluation.accessibilityStatement
  )
  manualEvaluationList: ManualEvaluation[];

  @OneToMany(
    (type) => AutomaticEvaluation,
    (evaluation) => evaluation.accessibilityStatement
  )
  automaticEvaluationList: AutomaticEvaluation[];

  @OneToMany(
    (type) => UserEvaluation,
    (evaluation) => evaluation.accessibilityStatement
  )
  userEvaluationList: UserEvaluation[];

  @OneToMany((type) => Contact, (contact) => contact.acessiblityStatement)
  contacts: Contact[];
}
