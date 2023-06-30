import { Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity("Collection_Date")
export class CollectionDate {
    @PrimaryGeneratedColumn()
    Id: number;

    @CreateDateColumn()
    CreatedAt: Date;
}