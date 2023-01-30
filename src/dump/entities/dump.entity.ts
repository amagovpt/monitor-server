import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
} from "typeorm";

@Entity("Dump")
export class Dump {
    @PrimaryGeneratedColumn({
        type: "int",
    })
    id: number;

    @Column({
        type: "varchar",
        nullable: false,
        length:256,
    })
    fileName:string;

    @Column({
        type: "datetime",
        nullable: false,
    })
    date:Date;

    @Column({
        type: "boolean",
        nullable: false,
    })
    ended:boolean;

}
