import { Connection, Repository } from 'typeorm';
import { User } from './user.entity';
import { Tag } from '../tag/tag.entity';
export declare class UserService {
    private readonly userRepository;
    private readonly tagRepository;
    private readonly connection;
    constructor(userRepository: Repository<User>, tagRepository: Repository<Tag>, connection: Connection);
    changePassword(userId: number, password: string, newPassword: string): Promise<any>;
    findAllNonAdmin(): Promise<User[]>;
    findAllFromMyMonitor(): Promise<User[]>;
    findById(id: string): Promise<User>;
    findByUsername(username: string): Promise<User | undefined>;
    findNumberOfStudyMonitor(): Promise<number>;
    findNumberOfMyMonitor(): Promise<number>;
    findStudyMonitorUserTagByName(userId: number, name: string): Promise<any>;
    createOne(user: User, websites: string[], transfer: boolean): Promise<boolean>;
    findType(username: string): Promise<any>;
    findAllWebsites(user: string): Promise<any>;
    findAllTags(user: string): Promise<any>;
}
