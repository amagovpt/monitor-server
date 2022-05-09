import { AccessibilityStatement } from "src/accessibility-statement-module/accessibility-statement/entities/accessibility-statement.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
@Entity("Automatic_Evaluation")
export class AutomaticEvaluation {
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
    Tool: string;

    @Column({
        type: 'text',
        length: 255,
        nullable: true
    })
    Summary: string;

    @ManyToOne((type => AccessibilityStatement), (accessibilityStatement) => accessibilityStatement.automaticEvaluationList)
    @JoinColumn({ name: "AccessibilityStatementId"})
    accessibilityStatement: AccessibilityStatement;

    
}
