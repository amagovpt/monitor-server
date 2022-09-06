import { IsNotEmpty } from 'class-validator';
export class CreateGovUserDto {
    @IsNotEmpty()
    CCNumber: string;
    @IsNotEmpty()
    name: string;

}
