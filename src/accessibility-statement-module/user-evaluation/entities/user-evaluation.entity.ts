import { Column,  Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn } from "typeorm";
import { AccessibilityStatement } from "../../accessibility-statement/entities/accessibility-statement.entity";
@Entity("User_Evaluation")
export class UserEvaluation {
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
    Participants: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true
    })
    Process: string;

    @Column({
        type: 'text',
        nullable: true
    })
    Summary: string;
    
    @ManyToOne((type => AccessibilityStatement), (accessibilityStatement) => accessibilityStatement.userEvaluationList)
    @JoinColumn({ name: "AccessibilityStatementId" })
    accessibilityStatement: AccessibilityStatement;
}
