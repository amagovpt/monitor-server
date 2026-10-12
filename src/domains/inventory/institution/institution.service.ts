import { Injectable, NotFoundException } from '@nestjs/common';
import { Institution } from './institution.entity';
import { InstitutionRequestDTO } from './dto/request/institution-request.dto';
import { InstitutionRepository } from './institution.repository';
import { InstitutionFilterDTO } from './dto/request/institution-filter.dto';
import { CreateInstitutionDto } from './dto/create-institution.dto';

@Injectable()
export class InstitutionService {
  constructor(private readonly institutionRepository: InstitutionRepository) {}

  async findAll(institutionRequestDTO: InstitutionRequestDTO): Promise<any> {
    const query = {
      filters: institutionRequestDTO.filters || {},
      sortings: institutionRequestDTO.sorts || {},
      pagination: institutionRequestDTO.pagination || {},
    };

    return await this.institutionRepository.findMany(query);
  }

  async getOne(institutionId: number): Promise<Institution> {
    const institution = await this.institutionRepository.findById(institutionId);
    if (!institution) throw new NotFoundException('Institution Not Found');
    return institution;
  }

  async findByProperties(properties: Partial<InstitutionFilterDTO>): Promise<any> {
    return this.institutionRepository.findOneBy(properties);
  }

  async createOne(createInstitutionDto: CreateInstitutionDto): Promise<Institution> {
    const institution = new Institution();
    institution.shortName = createInstitutionDto.shortName;
    institution.longName = createInstitutionDto.longName;

    const result = await this.institutionRepository.save(institution);
    return result;
  }

  async update(institutionId: number, shortName: string, longName: string): Promise<Institution> {
    return this.institutionRepository.update(institutionId, { shortName, longName });
  }

  async delete(institutionId: number): Promise<any> {
    return this.institutionRepository.deleteInstitution(institutionId);
  }
}
