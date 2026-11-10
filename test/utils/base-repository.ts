import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AppLoggerService } from '@core/app-logger/app-logger.service';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { IdentifiableModel } from 'src/common/interfaces/Identifiable.interface';

export const createBaseRepoMocks = <T extends IdentifiableModel>(
  entity: T,
): {
  mockOrmRepository: DeepMocked<Repository<T>>;
  mockQueryBuilder: DeepMocked<SelectQueryBuilder<T>>;
  mockLogger: DeepMocked<AppLoggerService>;
  mockConfigService: DeepMocked<ConfigService>;
} => {
  const mockQueryBuilder = createMock<SelectQueryBuilder<T>>();
  const mockOrmRepository = createMock<Repository<T>>();
  const mockLogger = createMock<AppLoggerService>();
  const mockConfigService = createMock<ConfigService>();
  Object.defineProperty(mockOrmRepository, 'metadata', {
    value: { name: 'MockEntity', primaryColumns: [{ propertyName: 'id' }] },
    configurable: true,
  });
  mockQueryBuilder.andWhere.mockReturnThis();
  mockQueryBuilder.andWhereInIds.mockReturnThis();
  mockQueryBuilder.addOrderBy.mockReturnThis();
  mockQueryBuilder.take.mockReturnThis();
  mockQueryBuilder.skip.mockReturnThis();
  mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

  mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

  mockConfigService.get.mockImplementation((key, def) =>
    key === 'PAGINATION_MAX_LIMIT' ? 100 : def,
  );
  mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  mockQueryBuilder.andWhere.mockReturnThis();
  mockQueryBuilder.andWhereInIds.mockReturnThis();
  mockQueryBuilder.addOrderBy.mockReturnThis();
  mockQueryBuilder.take.mockReturnThis();
  mockQueryBuilder.skip.mockReturnThis();
  mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

  return { mockOrmRepository, mockQueryBuilder, mockLogger, mockConfigService };
};
