import { IsOptional } from 'class-validator';
import { IsSortOrder } from 'src/common/decorators/is-sort-order.decorator';
import { SortCriteria } from 'src/common/interfaces/types';
import { BaseSortDto } from 'src/common/dto/request/base-sort.dto';
import { Website } from '../../../website.entity';

type TargetKeys = keyof Pick<
  Website,
  'id' | 'title' | 'baseUrl' | 'createdAt' | 'institutionId' | 'createdAt'
>;

type WebsiteSortContract = {
  [K in TargetKeys]: SortCriteria;
};

export class WebsiteSortDTO extends BaseSortDto<Website> implements WebsiteSortContract {
  @IsOptional()
  @IsSortOrder()
  id: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  title: SortCriteria;
  @IsOptional()
  @IsSortOrder()
  baseUrl: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  institutionId: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  createdAt: SortCriteria;

  getAllowedFields(): string[] {
    return ['id', 'title', 'baseUrl', 'createdAt', 'institutionId'];
  }
}
