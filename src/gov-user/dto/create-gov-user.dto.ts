import { IsNotEmpty } from 'class-validator';
export class CreateGovUserDto {
    @IsNotEmpty()
    ccNumber: string;
    @IsNotEmpty()
    name: string;

}
