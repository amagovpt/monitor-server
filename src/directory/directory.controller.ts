import {
  Controller,
  InternalServerErrorException,
  Post,
  Get,
  Request,
  Param,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DirectoryService } from "./directory.service";
import { Directory } from "./directory.entity";
import { success } from "../lib/response";

@Controller("directory")
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("reEvaluate")
  async reEvaluateWebsitePages(@Request() req: any): Promise<any> {
    const directoryId = req.body.directoryId;
    const option = req.body.option;

    return success(
      await this.directoryService.addPagesToEvaluate(directoryId, option)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all")
  async getAllTags(): Promise<any> {
    return success(await this.directoryService.findAll());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("create")
  async createDirectory(@Request() req: any): Promise<any> {
    const directory = new Directory();
    directory.Name = req.body.name;
    directory.Show_in_Observatory = req.body.observatory;
    directory.Method = req.body.method;
    directory.Creation_Date = new Date();

    const tags = JSON.parse(req.body.tags);

    const createSuccess = await this.directoryService.createOne(
      directory,
      tags
    );

    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/:directoryName")
  async checkIfTagNameExists(
    @Param("directoryName") directoryName: string
  ): Promise<boolean> {
    return success(
      !!(await this.directoryService.findByDirectoryName(directoryName))
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("update")
  async updateDirectory(@Request() req: any): Promise<any> {
    const directoryId = req.body.directoryId;
    const name = req.body.name;
    const observatory = req.body.observatory;
    const defaultTags = JSON.parse(req.body.defaultTags);
    const tags = JSON.parse(req.body.tags);

    const updateSuccess = await this.directoryService.update(
      directoryId,
      name,
      observatory,
      defaultTags,
      tags
    );

    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteDirectory(@Request() req: any): Promise<any> {
    const directoryId = req.body.directoryId;

    const deleteSuccess = await this.directoryService.delete(directoryId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("deleteBulk")
  async deleteDirectories(@Request() req: any): Promise<any> {
    const directoriesId = JSON.parse(req.body.directoriesId);

    const deleteSuccess = await this.directoryService.deleteBulk(directoriesId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("observatory/total")
  async getNumberOfObservatoryTags(): Promise<any> {
    return success(await this.directoryService.findNumberOfObservatory());
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("info/:directoryId")
  async getTagInfo(@Param("directoryId") directoryId: number): Promise<any> {
    return success(await this.directoryService.findInfo(directoryId));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":directory/tags")
  async getDirectoryTags(@Param("directory") directory: string): Promise<any> {
    return success(await this.directoryService.findAllDirectoryTags(directory));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":directory/websites")
  async getDirectoryWebsites(
    @Param("directory") directory: string
  ): Promise<any> {
    return success(
      await this.directoryService.findAllDirectoryWebsites(directory)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":directory/websites/pages")
  async getListOfDirectoryWebsitePages(
    @Param("directory") directory: string
  ): Promise<any> {
    return success(
      await this.directoryService.findAllDirectoryWebsitePages(directory)
    );
  }
}
