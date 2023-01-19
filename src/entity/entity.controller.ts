import {
  Controller,
  InternalServerErrorException,
  Get,
  Post,
  Request,
  Param,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { EntityService } from "./entity.service";
import { EntityTable } from "./entity.entity";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";

@Controller("entity")
@UseInterceptors(LoggingInterceptor)
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("reEvaluate")
  async reEvaluateWebsitePages(@Request() req: any): Promise<any> {
    const entitiesId = JSON.parse(req.body.entitiesId);
    const option = req.body.option;

    return success(
      await this.entityService.addPagesToEvaluate(entitiesId, option)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("observatory/total")
  async getNumberOfObservatoryEntities(): Promise<any> {
    return success(await this.entityService.findNumberOfObservatory());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all/count/:search")
  async getAdminEntityCount(@Param("search") search: string): Promise<any> {
    return success(
      await this.entityService.adminCount(
        decodeURIComponent(search.substring(7))
      )
    );
  }

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

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("info/:entityId")
  async getEntityInfo(@Param("entityId") entityId: number): Promise<any> {
    return success(await this.entityService.findInfo(entityId));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("create")
  async createEntity(@Request() req: any): Promise<any> {
    const entity = new EntityTable();
    entity.Short_Name = req.body.shortName;
    entity.Long_Name = req.body.longName;
    entity.Creation_Date = new Date();

    const websites = JSON.parse(req.body.websites);

    const createSuccess = await this.entityService.createOne(entity, websites);
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("update")
  async updateEntity(@Request() req: any): Promise<any> {
    const entityId = req.body.entityId;
    const shortName = req.body.shortName;
    const longName = req.body.longName;

    const defaultWebsites = JSON.parse(req.body.defaultWebsites);
    const websites = JSON.parse(req.body.websites);

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

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteEntity(@Request() req: any): Promise<any> {
    const entityId = req.body.entityId;

    const deleteSuccess = await this.entityService.delete(entityId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("deleteBulk")
  async deleteEntities(@Request() req: any): Promise<any> {
    const entitiesId = JSON.parse(req.body.entitiesId);

    const deleteSuccess = await this.entityService.deleteBulk(entitiesId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("pages/deleteBulk")
  async deleteEntitiesPages(@Request() req: any): Promise<any> {
    const entitiesId = JSON.parse(req.body.entitiesId);

    const deleteSuccess = await this.entityService.pagesDeleteBulk(entitiesId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/shortName/:shortName")
  async checkIfShortNameExists(
    @Param("shortName") shortName: string
  ): Promise<any> {
    return success(!!(await this.entityService.findByShortName(shortName)));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/longName/:longName")
  async checkIfLongNameExists(
    @Param("longName") longName: string
  ): Promise<any> {
    return success(!!(await this.entityService.findByLongName(longName)));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("websites/:entity")
  async getListOfEntityWebsites(@Param("entity") entity: string): Promise<any> {
    return success(await this.entityService.findAllWebsites(entity));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("websites/pages/:entity")
  async getListOfEntityWebsitePages(
    @Param("entity") entity: string
  ): Promise<any> {
    return success(await this.entityService.findAllWebsitesPages(entity));
  }
}
