import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Page } from "../../page/page.entity";
import { AutomaticEvaluation } from "./automatic-evaluation.entity";
import { ManualEvaluation } from "./manual-evaluation.entity";
import { UserEvaluation } from "./user-evaluation.entity";
@Entity("Accessibility_Statement")
export class AccessibilityStatement {
    @PrimaryGeneratedColumn()
    Accessibility_StatementId: number;

    @CreateDateColumn()
    CreatedAt: Date;

    @UpdateDateColumn({
        type: "timestamp",
        onUpdate: new Date().toString(),
        nullable: true
    })
    UpdatedAt: Date;

    @ManyToOne(type => Page)
    @JoinColumn({ name: "PageId", referencedColumnName: "PageId" })
    Page: Page;

    @Column({
        type: "varchar",
        length: 255,
        nullable: false,
    })
    url:string;

    @Column({
        type: "varchar",
        length: 255,
        nullable: false,
    })
    conformance: string;

    @Column({
        type: 'datetime',
        nullable: true,
    })
    statementDate: any;

    @OneToMany(type => ManualEvaluation, (evaluation) => evaluation.accessibilityStatement)
    ManualEvaluation: ManualEvaluation;


    @OneToMany(type => AutomaticEvaluation, (evaluation) => evaluation.accessibilityStatement)
    AutomaticEvaluation: AutomaticEvaluation;


    @OneToMany(type => UserEvaluation, (evaluation) => evaluation.accessibilityStatement)
    UserEvaluation: UserEvaluation;
}
