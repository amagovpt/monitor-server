export class CreateUserDto {
    password:string;
    username:string;
    names:string;
    emails:string;
    type:string;
    tags:string[];
    websites:string[];
    transfer:any;
}