import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { BaseTransactionalRepository } from 'src/common/repositories/base-transactional.repository';
import { FilterMap, SortingMap } from 'src/common/repositories/base.repository';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { Institution } from './institution.entity';
import { BaseFilter, BaseSort, SortCriteria } from 'src/common/interfaces/types';

export interface InstitutionFilter extends BaseFilter {
  id?: number;
  longName?: string;
  shortName?: string;
  createdAt?: Date;
  searchTerm?: string;
}

export interface InstitutionSort extends BaseSort {
  longName?: SortCriteria;
  shortName?: SortCriteria;
  createdAt?: SortCriteria;
}

@Injectable()
export class InstitutionRepository extends BaseTransactionalRepository<
  Institution,
  InstitutionFilter,
  InstitutionSort
> {
  protected readonly alias = 'inst';

  constructor(
    @InjectRepository(Institution)
    protected readonly ormRepo: Repository<Institution>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(ormRepo, logger, configService);
  }

  protected readonly filterMap: FilterMap<InstitutionFilter, Institution> = {
    id: (query, value) => {
      query.andWhere(`${this.alias}.id = :id`, { id: value });
    },
    ids: (query, value) => {
      query.andWhere(`${this.alias}.id IN (:...ids)`, { ids: value });
    },
    shortName: (query, value) => {
      query.andWhere(`${this.alias}.shortName LIKE :shortName`, { shortName: `%${value}%` });
    },
    longName: (query, value) => {
      query.andWhere(`${this.alias}.longName LIKE :longName`, { longName: `%${value}%` });
    },
    createdAt: (query, value) => {
      query.andWhere(`${this.alias}.createdAt = :createdAt`, { createdAt: value });
    },
    searchTerm: (query, value) => {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`${this.alias}.shortName LIKE :searchTerm`, {
            searchTerm: `%${value}%`,
          }).orWhere(`${this.alias}.longName LIKE :searchTerm`, { searchTerm: `%${value}%` });
        }),
      );
    },
  };

  protected readonly sortMap: SortingMap<InstitutionSort, Institution> = {
    id: (query, order) => this.addSort(query, 'id', order),
    shortName: (query, order) => this.addSort(query, 'shortName', order),
    longName: (query, order) => this.addSort(query, 'longName', order),
    createdAt: (query, order) => this.addSort(query, 'createdAt', order),
  };

  async findInfo(id: number): Promise<Institution | null> {
    return this.ormRepo
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(`${this.alias}.websites`, 'websites')
      .where(`${this.alias}.id = :id`, { id })
      .getOne();
  }

  async update(id: number, data: Partial<Institution>): Promise<Institution> {
    const institution = await this.ormRepo.findOne({
      where: { id },
    });

    if (!institution) throw new Error('Institution not found');

    Object.assign(institution, data);
    return await this.ormRepo.save(institution);
  }

  async deleteInstitution(institutionId: number): Promise<void> {
    await this.runInTransaction(async (queryRunner) => {
      await queryRunner.manager.delete(Institution, { id: institutionId });
    });
  }
}
