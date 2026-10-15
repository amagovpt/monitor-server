import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, IsUrl } from 'class-validator';
import { Website } from '../website.entity';
import { PickType } from '@nestjs/mapped-types';

export class CreateWebsiteDto extends PickType(Website, [
  'title',
  'baseUrl',
  'institutionId',
] as const) {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsUrl()
  baseUrl: string;

  @IsOptional()
  @IsNumber({}, { message: 'institutionId must be a number' })
  @Min(1, { message: 'institutionId must be greater than 0' })
  institutionId: number;
}
