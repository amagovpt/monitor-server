import { Column, Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn } from "typeorm";
import { AccessibilityStatement } from "./accessibility-statement.entity";
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
    
    @ManyToOne((type => AccessibilityStatement))
    @JoinColumn({ name: "AccessibilityStatementId" })
    accessibilityStatement: AccessibilityStatement;
}
