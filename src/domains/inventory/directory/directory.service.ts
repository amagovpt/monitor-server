import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryRequest, PaginationResponse } from 'src/common/repositories/base.repository';
import {
  DirectoryFilter,
  DirectoryRepository,
  DirectorySort,
} from './repositories/directory.repository';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { CreateDirectory } from './dto/create-diretory.dto';
import { UpdateDirectory } from './dto/update-diretory.dto';
import { DirectoryDTO } from './dto/directory.dto';
import { plainToInstance } from 'class-transformer';
import { BasePaginationDTO } from 'src/common/dto/request/base-pagination.dto';

@Injectable()
export class DirectoryService {
  constructor(private readonly repo: DirectoryRepository) {}

  async createOne(createDto: CreateDirectory): Promise<DirectoryDTO> {
    const directory = await this.repo.createWithTags(createDto);
    return plainToInstance(DirectoryDTO, directory, { excludeExtraneousValues: true });
  }

  async update(updateDto: UpdateDirectory): Promise<DirectoryDTO> {
    const directory = await this.repo.updateWithTags(updateDto);
    return plainToInstance(DirectoryDTO, directory, { excludeExtraneousValues: true });
  }

  async delete(ids: number[], securityContext: SecurityContext): Promise<void> {
    for (const id of ids) {
      await this.repo.delete(id);
    }
  }

  async findAll(
    queryArgs: QueryRequest<DirectoryFilter, DirectorySort, BasePaginationDTO>,
    securityContext: SecurityContext,
  ): Promise<PaginationResponse<DirectoryDTO>> {
    if (!securityContext?.user?.id) {
      throw new ForbiddenException('User not authenticated');
    }
    const query = {
      filters: queryArgs.filters || {},
      sortings: queryArgs.sortings || {},
      pagination: queryArgs.pagination || {},
      securityContext,
    };

    return this.repo.findMany(query);
  }

  async getDirectory(directoryId: number): Promise<DirectoryDTO> {
    const directory = await this.repo.findById(directoryId);
    if (!directory) {
      throw new NotFoundException(`Directory with ID ${directoryId} not found`);
    }
    return plainToInstance(DirectoryDTO, directory, { excludeExtraneousValues: true });
  }
}
