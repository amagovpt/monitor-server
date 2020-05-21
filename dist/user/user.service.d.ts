import { Connection, Repository } from 'typeorm';
import { User } from './user.entity';
import { Tag } from '../tag/tag.entity';
export declare class UserService {
    private readonly userRepository;
    private readonly tagRepository;
    private readonly connection;
    constructor(userRepository: Repository<User>, tagRepository: Repository<Tag>, connection: Connection);
    changePassword(userId: number, password: string, newPassword: string): Promise<any>;
    update(userId: number, password: string, names: string, emails: string, app: string, defaultWebsites: number[], websites: number[], transfer: boolean): Promise<any>;
    delete(userId: number, app: string): Promise<any>;
    findAllNonAdmin(): Promise<User[]>;
    findAllFromMyMonitor(): Promise<User[]>;
    findInfo(userId: number): Promise<any>;
    findById(id: string): Promise<User>;
    findByUsername(username: string): Promise<User | undefined>;
    findNumberOfStudyMonitor(): Promise<number>;
    findNumberOfMyMonitor(): Promise<number>;
    findStudyMonitorUserTagByName(userId: number, name: string): Promise<any>;
    createOne(user: User, tags: string[], websites: string[], transfer: boolean): Promise<boolean>;
    findType(username: string): Promise<any>;
    findAllWebsites(user: string): Promise<any>;
    findAllTags(user: string): Promise<any>;
}
