import { IsOptional } from 'class-validator';
import { IsSortOrder } from 'src/common/decorators/is-sort-order.decorator';
import { SortCriteria } from 'src/common/interfaces/types';
import { BaseSortDto } from 'src/common/dto/request/base-sort.dto';
import { Directory } from '../../../directory.entity';

export class DirectorySortDTO extends BaseSortDto<Directory> {
  @IsOptional()
  @IsSortOrder()
  id?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  tagId?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  tagName?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  websiteId?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  isDone?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  createdAt?: SortCriteria;

  getAllowedFields(): string[] {
    return ['id', 'tagId', 'tagName', 'websiteId', 'isDone', 'createdAt'];
  }
}
