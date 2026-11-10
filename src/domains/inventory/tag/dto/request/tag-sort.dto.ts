import { IsOptional } from 'class-validator';
import { IsSortOrder } from 'src/common/decorators/is-sort-order.decorator';
import { SortCriteria } from 'src/common/interfaces/types';
import { BaseSortDto } from 'src/common/dto/request/base-sort.dto';
import { Tag } from '../../tag.entity';

export class TagSortDTO extends BaseSortDto<Tag> {
  @IsOptional()
  @IsSortOrder()
  id?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  name?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  createdAt?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  createdById?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  updatedAt?: SortCriteria;

  getAllowedFields(): (keyof Tag)[] {
    return ['id', 'name', 'createdAt', 'createdById', 'updatedAt'];
  }
}
