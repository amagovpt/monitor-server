import {
  Controller, InternalServerErrorException, Post, Get, Param, UseGuards, UseInterceptors, Body,
  Delete,
  HttpCode,
  Patch,
  Query,
  Logger,
  ParseIntPipe,
} from "@nestjs/common";
import { InstitutionService } from "./institution.service";
import { Institution } from "./institution.entity";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { CreateInstitutionDto } from "./dto/create-institution.dto";
import { UpdateInstitutionDto } from "./dto/update-institution.dto";
import { DeleteInstitutionDto } from "./dto/delete-institution.dto";
import { InstitutionDocs } from "./institution.swagger";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { InstitutionRequestDTO } from "./dto/request/institution-request.dto";
import { LoggableController } from "src/common/controllers/loggable.interface";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";
import { FgaGuard } from "src/core/authorization/guards/fga.guard";
import { PaginationResponse } from "src/common/repositories/base.repository";
import { InstitutionResponseDTO } from "./dto/institution-response.dto";

@InstitutionDocs.controller()
@Controller("institutions")
@UseGuards(JwtAuthGuard,RolesGuard,FgaGuard)
@UseInterceptors(LoggingInterceptor)
export class InstitutionController implements LoggableController {
  readonly logger = new Logger("InstitutionController");
  constructor(private readonly institutionService: InstitutionService) {}


  @InstitutionDocs.info()
  @Roles(RoleSlug.ADMIN)
  @Get(":institutionId")
  @HttpCode(200)
  async getInstitution(@Param("institutionId", ParseIntPipe) institutionId: number,): Promise<InstitutionResponseDTO> {
    return await this.institutionService.getOne( institutionId );
  }
  @InstitutionDocs.findAllPaged()
  @Roles(RoleSlug.ADMIN)
  @Get("")
  @HttpCode(200)
  async getAllEntities(@Query() institutionRequestDTO:InstitutionRequestDTO): Promise<PaginationResponse<InstitutionResponseDTO>> {
    return await this.institutionService.findAll( institutionRequestDTO );
  }



  @InstitutionDocs.create()
  @FgaAuthorized({
            objectType: "role",
            action: "can_manage_users",
            resourceIdResolver: () => 'ams'
    })
  @Roles(RoleSlug.ADMIN)
  @Post("")
  @HttpCode(201)
  async createOrganization(@Body() createInstitutionDto: CreateInstitutionDto): Promise<InstitutionResponseDTO> {
 
    return await this.institutionService.createOne(createInstitutionDto );

  }

  @InstitutionDocs.update()
  @FgaAuthorized({
            objectType: "role",
            action: "can_edit_users",
            resourceIdResolver: () => 'ams'
    })
  @Roles(RoleSlug.ADMIN)
  @Patch("")
  @HttpCode(200)
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
  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
          objectType: "role",
          action: "can_manage_users",
          resourceIdResolver: () => 'ams'
  })
  @Delete("")
  @HttpCode(200)
  async deleteOrganization(@Body() deleteOrganizationDto: DeleteInstitutionDto): Promise<void> {
  const institutionId = deleteOrganizationDto.institutionId;
  await this.institutionService.delete(institutionId);

  }

 
}
