import { UserService } from './user.service';
import { User } from './user.entity';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    createUser(req: any): Promise<any>;
    getUser(id: string): Promise<User>;
    checkIfUsernameExists(username: string): Promise<boolean>;
    getAllNonAdminUsers(): Promise<any>;
    getAllMyMonitorUsers(): Promise<any>;
    getNumberOfStudyMonitorUsers(): Promise<any>;
    getNumberOfMyMonitorUsers(): Promise<any>;
}
