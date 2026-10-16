import { IsNumber, IsArray, IsString, IsUrl, ArrayMinSize, IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Optional } from '@nestjs/common';

export class CreatePageDto {
  @IsNumber({}, { message: 'websiteId must be a number' })
  @IsNotEmpty({ message: 'websiteId is required and must be a number' })
  websiteId: number;

  @IsArray({ message: 'pagesUrl must be an array of strings' })
  @ArrayMinSize(1, { message: 'pagesUrl must contain at least one URL' })
  @IsUrl({}, { each: true, message: 'Each URL in pagesUrl must be a valid URL' })
  @Transform(({ value }) => value?.map((url: string) => url.trim()))
  pagesUrl: string[];
}
