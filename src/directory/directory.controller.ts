import {
  Controller,
  InternalServerErrorException,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DirectoryService } from "./directory.service";
import { Directory } from "./directory.entity";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiBasicAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ReEvaluateDto } from "./dto/reEvaluate-pages.dto";
import { CreateDirectory } from "./dto/create-diretory.dto";
import { UpdateDirectory } from "./dto/update-diretory.dto";
import { DeleteDirectory } from "./dto/delete-diretory.dto";
import { DeleteBulkDirectory } from "./dto/delete-bulk-diretory.dto";
import { Tag } from "src/tag/tag.entity";
import { Website } from "src/website/website.entity";


@ApiBasicAuth()
@ApiTags('directory')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("directory")
@UseInterceptors(LoggingInterceptor)
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @ApiOperation({ summary: 'Reevaluate all pages from a directory' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("reEvaluate")
  async reEvaluateWebsitePages(@Body() reEvaluateDto: ReEvaluateDto): Promise<any> {
    const directoriesId = reEvaluateDto.directoriesId;
    const option = reEvaluateDto.option;

    return success(
      await this.directoryService.addPagesToEvaluate(directoriesId, option)
    );
  }

  @ApiOperation({ summary: 'Find all directories' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all")
  async getAllTags(): Promise<any> {
    return success(await this.directoryService.findAll());
  }

  @ApiOperation({ summary: 'Create a new directory' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("create")
  async createDirectory(@Body() createDirectory: CreateDirectory): Promise<any> {
    const directory = new Directory();
    directory.name = createDirectory.name;
    directory.showInObservatory = createDirectory.observatory;
    directory.method = createDirectory.method;
    directory.creationDate = new Date();

    const tags = createDirectory.tags;

    const createSuccess = await this.directoryService.createOne(
      directory,
      tags
    );

    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Check if directory name exists' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/:directoryName")
  async checkIfDictoryNameExists(
    @Param("directoryName") directoryName: string
  ): Promise<boolean> {
    return success(
      !!(await this.directoryService.findByDirectoryName(directoryName))
    );
  }

  @ApiOperation({ summary: 'Update a specific directory' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("update")
  async updateDirectory(@Body() updateDirectory: UpdateDirectory): Promise<any> {
    const directoryId = updateDirectory.directoryId;
    const name = updateDirectory.name;
    const observatory = updateDirectory.observatory;
    const method = updateDirectory.method;
    const defaultTags = updateDirectory.defaultTags;
    const tags = updateDirectory.tags;

    const updateSuccess = await this.directoryService.update(
      directoryId,
      name,
      observatory,
      method,
      defaultTags,
      tags
    );

    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Delete a specific directory' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteDirectory(@Body() deleteDirectory: DeleteDirectory): Promise<any> {
    const directoryId = deleteDirectory.directoryId;

    const deleteSuccess = await this.directoryService.delete(directoryId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Delete a list directories' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("deleteBulk")
  async deleteDirectories(@Body() deleteBulkDirectory: DeleteBulkDirectory): Promise<any> {
    const directoriesId = deleteBulkDirectory.directoriesId;

    const deleteSuccess = await this.directoryService.deleteBulk(directoriesId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }
  @ApiOperation({ summary: 'Delete all pages from a list directories' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("pages/deleteBulk")
  async deleteDirectoriesPages(@Body() deleteBulkDirectory: DeleteBulkDirectory): Promise<any> {
    const directoriesId = deleteBulkDirectory.directoriesId;

    const deleteSuccess = await this.directoryService.pagesDeleteBulk(
      directoriesId
    );
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Find number of observatory directories' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("observatory/total")
  async getNumberOfObservatoryDirectories(): Promise<any> {
    return success(await this.directoryService.findNumberOfObservatory());
  }

  @ApiOperation({ summary: 'Find a specific directory info' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Directory,
  })
  @UseGuards(AuthGuard("jwt"))
  @Get("info/:directoryId")
  async getDirectoryInfo(@Param("directoryId") directoryId: number): Promise<any> {
    return success(await this.directoryService.findInfo(directoryId));
  }


  @ApiOperation({ summary: 'Find all tags from a specific dirctory' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Array<Tag>,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":directory/tags")
  async getDirectoryTags(@Param("directory") directory: string): Promise<any> {
    return success(await this.directoryService.findAllDirectoryTags(directory));
  }

  @ApiOperation({ summary: 'Find all websites from a specific dirctory' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Array<Website>,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get(":directory/websites")
  async getDirectoryWebsites(
    @Param("directory") directory: string
  ): Promise<any> {
    return success(
      await this.directoryService.findAllDirectoryWebsites(directory)
    );
  }


  @ApiOperation({ summary: 'Find all pages from a specific dirctory' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Array<Website>,
  })
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
