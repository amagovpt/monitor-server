import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Context } from './context.entity';

@Injectable()
export class ContextService {
  constructor(
    @InjectRepository(Context)
    private readonly contextRepository: Repository<Context>,
  ) {}

  async findAll(): Promise<Context[]> {
    return this.contextRepository.find();
  }

  async findOne(id: number): Promise<Context> {
    const context = await this.contextRepository.findOne({ where: { id } });
    if (!context) {
      throw new NotFoundException(`Contexto com ID ${id} não encontrado.`);
    }
    return context;
  }

  async findByCode(code: string): Promise<Context> {
    const context = await this.contextRepository.findOne({ where: { code } });
    if (!context) {
      throw new NotFoundException(`Contexto com o código '${code}' não encontrado.`);
    }
    return context;
  }

  async create(dto: { code: string; name?: string }): Promise<Context> {
    const context = this.contextRepository.create(dto);
    return this.contextRepository.save(context);
  }
}
