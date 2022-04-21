import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Page } from "../../page/page.entity";
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
}
