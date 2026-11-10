import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { WebsiteFilterDTO } from './website-filter.dto';
import { WebsiteSortDTO } from './website-sort.dto';
import { Type } from 'class-transformer';
import { ContextEnum } from 'src/domains/inventory/context/context.enum';
import { BasePaginationDTO } from 'src/common/dto/request/base-pagination.dto';

export class WebsiteQueryRequestDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => WebsiteFilterDTO)
  filters: WebsiteFilterDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebsiteSortDTO)
  sorts: WebsiteSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => BasePaginationDTO)
  pagination: BasePaginationDTO;

  @IsOptional()
  @IsString({ each: true, message: 'Each context must be a string' })
  @IsEnum(ContextEnum, { each: true, message: 'Each context must be a valid Context Enum value.' })
  contexts: ContextEnum[];
}
