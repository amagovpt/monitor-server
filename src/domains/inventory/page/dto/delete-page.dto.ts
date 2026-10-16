import { IsNumber, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class DeletePagesDto {
  @IsArray({ message: 'pageIds must be an array of numbers' })
  @ArrayMinSize(1, { message: 'pageIds must contain at least one number' })
  @IsNumber({}, { each: true, message: 'pageIds must be an array of numbers' })
  @Type(() => Number)
  pageIds: number[];
}
