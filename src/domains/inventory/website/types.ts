import { BaseFilter, BaseSort, BasePagination, SortCriteria } from 'src/common/interfaces/types';
import { ContextEnum } from '../context/context.enum';
import { SecurityContext } from 'src/core/authentication/interfaces/types';
import { Website } from './website.entity';

export interface WebsiteFilter extends BaseFilter {
  searchTerm?: string;
  baseUrl?: string;
  directoryId?: number;
  institutionId?: number;
  tagId?: number;
}

export interface WebsiteSort extends BaseSort {
  title?: SortCriteria;
  createdAt?: SortCriteria;
  id?: SortCriteria;
  baseUrl?: SortCriteria;
  institutionId?: SortCriteria;
  score?: SortCriteria;
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WebsitePagination extends BasePagination {}

export type WebsiteQueryRequest = {
  filters?: Partial<WebsiteFilter>;
  sortings?: Partial<WebsiteSort>;
  pagination?: Partial<WebsitePagination>;
  contexts: ContextEnum[];
  securityContext: SecurityContext;
};

export type WebsiteWithAvgScore = Pick<
  Website,
  'id' | 'title' | 'baseUrl' | 'institutionId' | 'createdAt'
> & { avgScore: number | null };
