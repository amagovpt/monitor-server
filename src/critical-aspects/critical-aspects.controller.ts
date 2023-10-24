import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { CriticalAspectService } from "./critical-aspects.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiTags, ApiResponse, ApiOperation } from "@nestjs/swagger";
import { WebSiteCriteriaNotesDTO } from "./dto/website-criteria-notes.dto";
import { AuthGuard } from "@nestjs/passport";

//@ApiBasicAuth()
@ApiTags('critical-aspects')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("critical-aspects")
@UseInterceptors(LoggingInterceptor)
export class CriticalAspectsController {
  constructor(private readonly criticalAspectsService: CriticalAspectService) { }

  @ApiOperation({ summary: 'Find all notes by websiteId and checklistId' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @Get("allNotes/:checklistId/:websiteId")
  @UseGuards(AuthGuard("jwt-admin"))
  async getAllNotesByChieckListIdAndWebsiteId(@Param('checklistId') checklistId: string, 
                                              @Param('websiteId') websiteId: number): Promise<any> {
    return success(await this.criticalAspectsService.findAllNotesByChecklistIdAndWebsiteId(checklistId, websiteId));
  }

  @ApiOperation({ summary: 'Find all users MyMonitor' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all")
  async getAllMyMonitorUsers(): Promise<any> {
    return success(await this.criticalAspectsService.findAllByWebsite(1));
  }

  @ApiOperation({ summary: 'Save user notes' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("save-notes")
  async saveWebsiteNotes(@Body() notes: Map<number, WebSiteCriteriaNotesDTO>): Promise<any> {
    return success(await this.criticalAspectsService.saveNotes(Object.keys(notes).map(function (key) {
      return notes[key];
    })));
  }

  @ApiOperation({ summary: 'Count conform declarations' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("count-conform-notes/:id")
  async countConformNotes(@Param("id") id:number): Promise<any> {
    return success(await this.criticalAspectsService.countConformNotes(1));
  }
}
