import { Injectable, NotFoundException } from '@nestjs/common';
import { WebsiteDetailDTO } from './dto/website-detail.dto';

import { Website } from './website.entity';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { PaginationResponse } from 'src/common/repositories/base.repository';
import { WebsiteRepository } from './repositories/website.repository';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { BaseService } from 'src/common/services/base.service';
import { ContextEnum, ContextMap } from '../context/context.enum';
import { WebsiteDTO } from './dto/website.dto';
import { WebsiteQueryRequestDTO } from './dto/request/query/website-query-request.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class WebsiteService extends BaseService {
  constructor(private readonly repository: WebsiteRepository) {
    super('WebsiteService');
  }

  async findMany(
    queryArgs: WebsiteQueryRequestDTO,
    contexts: ContextEnum[],
    securityContext: SecurityContext,
  ): Promise<PaginationResponse<Website>> {
    const query = {
      filters: queryArgs.filters || {},
      sortings: queryArgs.sorts || {},
      pagination: queryArgs.pagination || {},
      contexts,
      securityContext,
    };
    return this.repository.findManySecure(query);
  }

  async createWebsite(
    createDto: CreateWebsiteDto,
    securityContext: SecurityContext,
  ): Promise<Website> {
    const actorId = securityContext.user.id;

    const website = this.repository.orm.create();
    Object.assign(website, createDto);
    website.createdById = actorId;
    website.contexts = [{ id: securityContext.user.context.id } as any];

    const savedWebsite = await this.repository.createWebsite(website);

    if (!savedWebsite) {
      throw new Error('Failed to create website');
    }

    return savedWebsite;
  }

  async findOne(id: number, securityContext: SecurityContext): Promise<WebsiteDetailDTO> {
    const website: Website | null = await this.repository.orm.findOne({
      where: { id },
      relations: ['institution'],
    });

    if (!website) {
      throw new NotFoundException(`Website with ID ${id} not found`);
    }
    const websiteDetail = plainToInstance(WebsiteDetailDTO, website);
    return websiteDetail;
  }

  async update(
    websiteId: number,
    updateDto: UpdateWebsiteDto,
    securityContext: SecurityContext,
  ): Promise<Website> {
    const website = await this.repository.findById(websiteId);
    if (!website) {
      throw new NotFoundException(`Website with ID ${websiteId} not found`);
    }
    Object.assign(website, updateDto);
    website.updatedById = securityContext.user.id;
    return await this.repository.save(website);
  }

  async delete(ids: number[], securityContext: SecurityContext): Promise<void> {
    await this.repository.deleteWebsites(ids);
  }

  async changeWebsiteContexts(
    websiteId: number,
    contexts: ContextEnum[],
    actorId: number,
  ): Promise<WebsiteDTO> {
    const website = await this.repository.findById(websiteId);
    if (!website) {
      throw new NotFoundException(`Website with ID ${websiteId} not found`);
    }
    website.contexts = contexts.map((context) => ({ id: ContextMap[context] })) as any[];
    await this.repository.save(website);
    return website;
  }
}
