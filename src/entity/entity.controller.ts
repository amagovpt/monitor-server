import {
  Controller,
  InternalServerErrorException,
  Get,
  Post,
  Request,
  Param,
  UseGuards,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { EntityService } from "./entity.service";
import { EntityTable } from "./entity.entity";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiBasicAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ReevaluateEntityDto } from "./dto/reevalute-entity.dto";
import { CreateEntityDto } from "./dto/create-entity.dto";
import { UpdateEntityDto } from "./dto/update-entity.dto";
import { DeleteEntityDto } from "./dto/delete-entity.dto";
import { DeleteBulkEntityDto } from "./dto/delete-bulk-entity.dto";
import { Website } from "src/website/website.entity";
import { Page } from "src/page/page.entity";


@ApiBasicAuth()
@ApiTags('entity')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("entity")
@UseInterceptors(LoggingInterceptor)
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @ApiOperation({ summary: 'Reevaluate all pages from an entity list' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("reEvaluate")
  async reEvaluateWebsitePages(@Body() reevaluateEntityDto: ReevaluateEntityDto): Promise<any> {
    const entitiesId = reevaluateEntityDto.entitiesId;
    const option = reevaluateEntityDto.option;

    return success(
      await this.entityService.addPagesToEvaluate(entitiesId, option)
    );
  }

  @ApiOperation({ summary: 'Find number of entities in Observatory' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("observatory/total")
  async getNumberOfObservatoryEntities(): Promise<any> {
    return success(await this.entityService.findNumberOfObservatory());
  }

  @ApiOperation({ summary: 'Find entity by search term in AMS' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all/count/:search")
  async getAdminEntityCount(@Param("search") search: string): Promise<any> {
    return success(
      await this.entityService.adminCount(
        decodeURIComponent(search.substring(7))
      )
    );
  }

  @ApiOperation({ summary: 'Find entity by search term, size, page, sort and sort direction in AMS' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Number,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all/:size/:page/:sort/:direction/:search")
  async getAllEntities(
    @Param("size") size: string,
    @Param("page") page: string,
    @Param("sort") sort: string,
    @Param("direction") direction: string,
    @Param("search") search: string
  ): Promise<any> {
    return success(
      await this.entityService.findAll(
        parseInt(size),
        parseInt(page),
        sort.substring(5),
        direction.substring(10),
        decodeURIComponent(search.substring(7))
      )
    );
  }

  @ApiOperation({ summary: 'Find entity info by id' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: EntityTable,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("info/:entityId")
  async getEntityInfo(@Param("entityId") entityId: number): Promise<any> {
    return success(await this.entityService.findInfo(entityId));
  }

  @ApiOperation({ summary: 'Create a new entity' })
  @ApiResponse({
    status: 200,
    description: 'A new entity was created',
    type: EntityTable,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("create")
  async createEntity(@Body() createEntityDto: CreateEntityDto): Promise<any> {
    const entity = new EntityTable();
    entity.Short_Name = createEntityDto.shortName;
    entity.Long_Name = createEntityDto.longName;
    entity.Creation_Date = new Date();

    const websites = createEntityDto.websites;

    const createSuccess = await this.entityService.createOne(entity, websites);
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Update a specific entity' })
  @ApiResponse({
    status: 200,
    description: 'The entity was updated',
    type: EntityTable,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("update")
  async updateEntity(@Body() updateEntityDto: UpdateEntityDto): Promise<any> {
    const entityId = updateEntityDto.entityId;
    const shortName = updateEntityDto.shortName;
    const longName = updateEntityDto.longName;

    const defaultWebsites = updateEntityDto.defaultWebsites;
    const websites = updateEntityDto.websites;

    const updateSuccess = await this.entityService.update(
      entityId,
      shortName,
      longName,
      websites,
      defaultWebsites
    );
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Delete a specific entity' })
  @ApiResponse({
    status: 200,
    description: 'The entity was deleted',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteEntity(@Body() deleteEntityDto: DeleteEntityDto): Promise<any> {
    const entityId = deleteEntityDto.entityId;

    const deleteSuccess = await this.entityService.delete(entityId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Delete a list of entities' })
  @ApiResponse({
    status: 200,
    description: 'The entity list was deleted',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("deleteBulk")
  async deleteEntities(@Request() deleteBulkEntityDto: DeleteBulkEntityDto): Promise<any> {
    const entitiesId = deleteBulkEntityDto.entitiesId;

    const deleteSuccess = await this.entityService.deleteBulk(entitiesId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Delete all pages from a list of entities' })
  @ApiResponse({
    status: 200,
    description: 'The page list was deleted',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("pages/deleteBulk")
  async deleteEntitiesPages(@Body() deleteBulkEntityDto: DeleteBulkEntityDto): Promise<any> {
    const entitiesId = deleteBulkEntityDto.entitiesId;

    const deleteSuccess = await this.entityService.pagesDeleteBulk(entitiesId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Check if entity exists by short-name' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/shortName/:shortName")
  async checkIfShortNameExists(
    @Param("shortName") shortName: string
  ): Promise<any> {
    return success(!!(await this.entityService.findByShortName(shortName)));
  }

  @ApiOperation({ summary: 'Check if entity exists by long-name' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/longName/:longName")
  async checkIfLongNameExists(
    @Param("longName") longName: string
  ): Promise<any> {
    return success(!!(await this.entityService.findByLongName(longName)));
  }

  @ApiOperation({ summary: 'Find all the websites in a specific entity' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Array<Website>,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("websites/:entity")
  async getListOfEntityWebsites(@Param("entity") entity: string): Promise<any> {
    return success(await this.entityService.findAllWebsites(entity));
  }

  @ApiOperation({ summary: 'Find all theh pages in a specific entity' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Array<Page>,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("websites/pages/:entity")
  async getListOfEntityWebsitePages(
    @Param("entity") entity: string
  ): Promise<any> {
    return success(await this.entityService.findAllWebsitesPages(entity));
  }
}
