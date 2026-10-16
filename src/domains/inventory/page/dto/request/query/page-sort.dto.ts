import { IsOptional } from 'class-validator';
import { IsSortOrder } from 'src/common/decorators/is-sort-order.decorator';
import { SortCriteria } from 'src/common/interfaces/types';
import { BaseSortDto } from 'src/common/dto/request/base-sort.dto';
import { Page } from '../../../page.entity';

export class PageSortDTO extends BaseSortDto<Page> {
  @IsOptional()
  @IsSortOrder()
  id?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  websiteId?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  isInObservatory?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  createdAt?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  url?: SortCriteria;

  getAllowedFields(): string[] {
    return ['id', 'websiteId', 'isInObservatory', 'createdAt', 'url'];
  }
}
