import { Controller, Get, Param } from '@nestjs/common';
import { ContextService } from './context.service';
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';
import { Context } from './context.entity';

@Controller('contexts')
@Protected({ roles: [RoleSlug.ADMIN] })
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
