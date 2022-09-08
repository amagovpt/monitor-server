import { User } from 'src/user/user.entity';
import {
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn
} from 'typeorm';
@Entity()
export class GovUser {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100, nullable: false })
    name: string;

    @Column({ type: 'varchar', nullable: true })
    ccNumber: string;

    @ManyToMany((type) => User, (user) => user.govUsers)
    entities: User[];
}
