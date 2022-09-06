import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateGovUserDto } from './create-gov-user.dto';

export class UpdateGovUserDto extends PartialType(CreateGovUserDto) {
    @IsNotEmpty()
    @IsNumber()
    id: number;
}
