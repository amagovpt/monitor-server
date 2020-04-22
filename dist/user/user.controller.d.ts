import { UserService } from './user.service';
import { User } from './user.entity';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    changeUserPassword(req: any): Promise<any>;
    createUser(req: any): Promise<any>;
    updateUser(req: any): Promise<any>;
    deleteUser(req: any): Promise<any>;
    getUser(id: string): Promise<User>;
    getUserInfo(userId: number): Promise<User>;
    checkIfUsernameExists(username: string): Promise<boolean>;
    getAllNonAdminUsers(): Promise<any>;
    getAllMyMonitorUsers(): Promise<any>;
    getNumberOfStudyMonitorUsers(): Promise<any>;
    getNumberOfMyMonitorUsers(): Promise<any>;
    checkIfUserTagNameExists(req: any, name: string): Promise<any>;
    getUserType(user: string): Promise<any>;
    getListOfUserWebsites(user: string): Promise<any>;
    getListOfUserTags(user: string): Promise<any>;
}
