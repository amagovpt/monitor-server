import { IsOptional } from 'class-validator';
import { IsSortOrder } from 'src/common/decorators/is-sort-order.decorator';
import { SortCriteria } from 'src/common/interfaces/types';
import { User } from '../../user.entity';

type TargetKeys = keyof Pick<User, 'id' | 'username' | 'createdAt' | 'updatedAt' | 'lastLogin'>;

type UserSortContract = {
  [K in TargetKeys]: SortCriteria;
};

export class UserSortDTO implements UserSortContract {
  @IsOptional()
  @IsSortOrder()
  id: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  username: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  createdAt: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  updatedAt: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  lastLogin: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  role: SortCriteria;
}
