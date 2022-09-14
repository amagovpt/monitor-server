import { User } from 'src/user/user.entity';
import {
    Column,
    Entity,
    ManyToMany,
    JoinTable,
    PrimaryGeneratedColumn
} from 'typeorm';
@Entity({ name: "GovUser" })
export class GovUser {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100, nullable: false })
    name: string;

    @Column({ type: 'varchar', nullable: true })
    ccNumber: string;

    @JoinTable({name:"UserGovUser"})
    @ManyToMany((type) => User, (user) => user.govUsers)
    entities: User[];
}
