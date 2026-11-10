import { Controller, Get, Param } from '@nestjs/common';
import { ContextService } from './context.service';
import { Context } from './context.entity';

@Controller('contexts')
export class ContextController {
  constructor(private readonly contextService: ContextService) {}

  @Get()
  async getAllContexts(): Promise<Context[]> {
    return this.contextService.findAll();
  }

  @Get(':code')
  async getContextByCode(@Param('code') code: string): Promise<Context> {
    return this.contextService.findByCode(code);
  }
}
