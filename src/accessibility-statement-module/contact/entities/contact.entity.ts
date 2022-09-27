import { AccessibilityStatement } from "src/accessibility-statement-module/accessibility-statement/entities/accessibility-statement.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity("Contact")
export class Contact {

    @PrimaryGeneratedColumn()
    Id: number;

    @Column({
        type: "varchar",
        length: 255,
    })
    ContactType:string;

    @Column({
        type: "varchar",
        length: 255,
    })
    Contact:string;
    
    @OneToMany(type => AccessibilityStatement, (statement) => statement.contacts)
    acessiblityStatement:AccessibilityStatement;
}
