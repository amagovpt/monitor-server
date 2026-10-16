import { BaseFilter, BasePagination, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { Context } from '../context/context.identity';
import { ContextEnum } from '../context/context.enum';
import { SecurityContext } from 'src/core/authentication/interfaces/types';

export interface PageFilter extends BaseFilter {
  id?: number;
  websiteId?: number;
  searchTerm?: string;
  contexts?: Context[];
  archived?: boolean;
}

export interface PageSort extends BaseSort {
  url?: SortCriteria;
  createdAt?: SortCriteria;
  id?: SortCriteria;
  websiteId?: SortCriteria;
  isInObservatory?: SortCriteria;
}

export type PageQueryRequest = {
  filters: Partial<PageFilter>;
  sortings: Partial<PageSort>;
  pagination: Partial<BasePagination>;
  contexts: ContextEnum[];
  securityContext: SecurityContext;
};
export interface PageRecord {
  url: string;
  urlHash: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PagePagination extends BasePagination {}
