import {
  Controller,
  InternalServerErrorException,
  Post,
  Get,
  Param,
  UseInterceptors,
  Body,
  Delete,
  HttpCode,
  Patch,
  Query,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { Institution } from './institution.entity';
import { LoggingInterceptor } from 'src/core/log/log.interceptor';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { DeleteInstitutionDto } from './dto/delete-institution.dto';
import { InstitutionDocs } from './institution.swagger';
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { InstitutionRequestDTO } from './dto/request/institution-request.dto';
import { LoggableController } from 'src/common/controllers/loggable.interface';
import { PaginationResponse } from 'src/common/repositories/base.repository';
import { InstitutionResponseDTO } from './dto/institution-response.dto';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@InstitutionDocs.controller()
@Controller('institutions')
@UseInterceptors(LoggingInterceptor)
export class InstitutionController implements LoggableController {
  readonly logger = new Logger('InstitutionController');
  constructor(private readonly institutionService: InstitutionService) {}

  @InstitutionDocs.info()
  @Get(':institutionId')
  @HttpCode(200)
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async getInstitution(
    @Param('institutionId', ParseIntPipe) institutionId: number,
  ): Promise<InstitutionResponseDTO> {
    return await this.institutionService.getOne(institutionId);
  }
  @InstitutionDocs.findAllPaged()
  @Get('')
  @HttpCode(200)
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async getAllEntities(
    @Query() institutionRequestDTO: InstitutionRequestDTO,
  ): Promise<PaginationResponse<InstitutionResponseDTO>> {
    return await this.institutionService.findAll(institutionRequestDTO);
  }

  @InstitutionDocs.create()
  @Post('')
  @HttpCode(201)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async createOrganization(
    @Body() createInstitutionDto: CreateInstitutionDto,
  ): Promise<InstitutionResponseDTO> {
    return await this.institutionService.createOne(createInstitutionDto);
  }

  @InstitutionDocs.update()
  @Patch('')
  @HttpCode(200)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_edit_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async updateOrganization(@Body() udateInstitutionDto: UpdateInstitutionDto): Promise<boolean> {
    const institutionId = udateInstitutionDto.institutionId;
    const shortName = udateInstitutionDto.shortName;
    const longName = udateInstitutionDto.longName;

    const updateSuccess = await this.institutionService.update(institutionId, shortName, longName);
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }
    return true;
  }

  @InstitutionDocs.delete()
  @Delete('')
  @HttpCode(200)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async deleteOrganization(@Body() deleteOrganizationDto: DeleteInstitutionDto): Promise<void> {
    const institutionId = deleteOrganizationDto.institutionId;
    await this.institutionService.delete(institutionId);
  }
}
