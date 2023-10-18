import { Role } from "../role";

export class CreateUserDto {
    role:Role
    password:string;
    username:string;
    names:string;
    emails:string;
    type:string;
    tags:string[];
    websites:string[];
    transfer:any;
}