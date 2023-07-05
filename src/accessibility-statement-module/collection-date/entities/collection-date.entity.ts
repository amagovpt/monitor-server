import { Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity("Collection_Date")
export class CollectionDate {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;
}