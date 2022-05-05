import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import { AccessibilityStatement } from "./accessibility-statement.entity";
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

    @ManyToOne((type => AccessibilityStatement))
    @JoinColumn({ name: "AccessibilityStatementId"})
    accessibilityStatement: AccessibilityStatement;

    
}
