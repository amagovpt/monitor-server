import { AccessibilityStatement } from "src/accessibility-statement-module/accessibility-statement/entities/accessibility-statement.entity";
import { Column, Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn } from "typeorm";
@Entity("Manual_Evaluation")
export class ManualEvaluation {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true
    })
    Title: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true
    })
    Url: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true
    })
    Sample: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true
    })
    Heuristics: string;

    @Column({
        type: 'text',
        length: 255,
        nullable: true
    })
    Summary: string;
    
    @ManyToOne((type => AccessibilityStatement), (accessibilityStatement) => accessibilityStatement.manualEvaluationList)
    @JoinColumn({ name: "AccessibilityStatementId" })
    accessibilityStatement: AccessibilityStatement;
}
