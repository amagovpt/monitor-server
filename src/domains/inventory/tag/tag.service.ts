import { Injectable, NotFoundException } from '@nestjs/common';
import { Tag } from './tag.entity';
import { BaseService } from 'src/common/services/base.service';
import { TagRepository } from './tag.repository';
import { TagRequestDTO } from './dto/request/tag-request.dto';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { PaginationResponse } from 'src/common/repositories/base.repository';
import { UpdateTagDTO } from './dto/update-tag.dto';
import { CreateTagDTO } from './dto/create-tag.dto';

@Injectable()
export class TagService extends BaseService {
  constructor(private readonly tagRepository: TagRepository) {
    const context = 'TagService';
    super(context);
  }

  async findAll(queryDto: TagRequestDTO): Promise<PaginationResponse<Tag>> {
    const query = {
      filters: queryDto.filters || {},
      sortings: queryDto.sorts || {},
      pagination: queryDto.pagination || {},
    };

    return await this.tagRepository.findMany(query);
  }

  async findById(tagId: number): Promise<Tag> {
    const tag = await this.tagRepository.getOrmRepository().findOne({ where: { id: tagId } });
    if (!tag) {
      throw new NotFoundException(
        `Tag with id ${tagId} not found or you don't have permission to access it`,
      );
    }
    return tag;
  }

  async findByName(tagName: string): Promise<Tag | null> {
    const tag = await this.tagRepository.findOneBy({ name: tagName });
    if (!tag) {
      throw new NotFoundException(`Tag with name ${tagName} not found`);
    }
    return tag;
  }

  async update(updateTagDto: UpdateTagDTO, user: AuthenticatedUser): Promise<Tag> {
    return await this.tagRepository.runInTransaction(async (repo) => {
      const tag = await repo.manager.findOne(Tag, {
        where: { id: updateTagDto.tagId },
      });
      if (!tag) {
        throw new NotFoundException(
          `Tag with id ${updateTagDto.tagId} not found or you don't have permission to update it`,
        );
      }

      if (updateTagDto.name !== undefined) {
        tag.name = updateTagDto.name;
      }

      tag.updatedAt = new Date();
      tag.updatedById = user.id;

      return await repo.manager.save(tag);
    });
  }

  async createOne(createDto: CreateTagDTO, user: AuthenticatedUser): Promise<Tag> {
    return await this.tagRepository.runInTransaction(async (repo) => {
      const tag = new Tag();
      tag.name = createDto.name;
      tag.createdAt = new Date();
      tag.createdById = user.id;

      return await repo.manager.save(tag);
    });
  }

  async deleteBulk(tagsId: Array<number>): Promise<void> {
    if (!tagsId || tagsId.length === 0) {
      return;
    }
    await this.tagRepository.deleteBulk(tagsId);
  }
}
