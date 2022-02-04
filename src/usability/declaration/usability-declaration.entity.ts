import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Page} from "../../page/page.entity";

@Entity("Usability_Declaration")
export class UsabilityDeclaration {
    @PrimaryGeneratedColumn()
    UsabilityDeclarationId: number;

    @Column()
    PageId: number;

    @Column()
    DeclarationUrls: string;

    @Column({
        default: false
    })
    Processed: boolean;

    @Column({
        default: false
    })
    Synced: boolean;

    @Column()
    FunctionalAspectsCompliance: number

    @Column()
    ContentCompliance: number

    @Column()
    TransactionCompliance: number

    @CreateDateColumn()
    CreatedAt: Date;

    @UpdateDateColumn({
        type: "timestamp",
        onUpdate: new Date().toString(),
        nullable: true
    })
    UpdatedAt: Date;

    @ManyToOne(type => Page)
    @JoinColumn({name: "PageId", referencedColumnName: "PageId"})
    Page: Page;
}

export class UsabilityDeclarationWebsiteName extends UsabilityDeclaration {
    Name: string;
}
