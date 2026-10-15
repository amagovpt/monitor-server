import { BaseFilterDTO } from 'src/common/dto/request/base-filter.dto';
import { IsOptional, IsNumber, IsString, IsUrl, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { Page } from '../../../page.entity';

export class PageFilterDTO
  extends BaseFilterDTO<Page>
  implements Partial<Pick<Page, 'id' | 'websiteId' | 'url'>>
{
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  websiteId?: number;

  @IsOptional()
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url?: string;

  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsBoolean()
  archived: boolean = false;
}
