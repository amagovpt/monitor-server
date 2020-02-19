import { Connection, Repository } from 'typeorm';
import { Tag } from './tag.entity';
export declare class TagService {
    private readonly tagRepository;
    private readonly connection;
    constructor(tagRepository: Repository<Tag>, connection: Connection);
    findByTagName(tagName: string): Promise<Tag | undefined>;
    findAll(): Promise<any>;
    findAllOfficial(): Promise<any>;
    createOne(tag: Tag): Promise<boolean>;
}
