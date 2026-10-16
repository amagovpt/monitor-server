import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PageFilterDTO } from './page-filter.dto';
import { PageSortDTO } from './page-sort.dto';
import { ResourceQueryDto } from 'src/common/dto/request/query-request.dto';
import { Page } from '../../../page.entity';
import { BasePaginationDTO } from 'src/common/dto/request/base-pagination.dto';
import { ContextEnum } from 'src/domains/inventory/context/context.enum';

export class PageQueryRequestDTO extends ResourceQueryDto<
  Page,
  PageFilterDTO,
  PageSortDTO,
  BasePaginationDTO
> {
  @IsOptional()
  @ValidateNested()
  @Type(() => PageFilterDTO)
  filters: PageFilterDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => PageSortDTO)
  sorts: PageSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => BasePaginationDTO)
  pagination: BasePaginationDTO;

  @IsOptional()
  @IsString({ each: true, message: 'Each context must be a string' })
  @IsEnum(ContextEnum, { each: true, message: 'Each context must be a valid Context Enum value.' })
  contexts: ContextEnum[];
}
