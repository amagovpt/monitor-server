import { IsOptional } from 'class-validator';
import { IsSortOrder } from 'src/common/decorators/is-sort-order.decorator';
import { SortCriteria } from 'src/common/interfaces/types';
import { BaseSortDto } from 'src/common/dto/request/base-sort.dto';
import { Institution } from '../../institution.entity';

export class InstitutionSortDTO extends BaseSortDto<Institution> {
  @IsOptional()
  @IsSortOrder()
  id?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  shortName?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  longName?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  createdAt?: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  updatedAt?: SortCriteria;

  getAllowedFields(): (keyof Institution)[] {
    return ['id', 'shortName', 'longName', 'createdAt', 'updatedAt'];
  }
}
