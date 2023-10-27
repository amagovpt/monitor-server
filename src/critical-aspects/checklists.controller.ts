import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ChecklistsService } from "./checklists.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiTags, ApiResponse, ApiOperation } from "@nestjs/swagger";
import { WebSiteCriteriaNotesDTO } from "./dto/website-criteria-notes.dto";
import { AuthGuard } from "@nestjs/passport";
import { ShareCodeDto } from "./dto/share-code.dto";

@ApiTags('Checklists')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("checklists")
@UseInterceptors(LoggingInterceptor)
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) { }

  @ApiOperation({ summary: 'Find all notes by websiteId and checklistId' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @Get("allNotes/:checklistId/:websiteId")
  @UseGuards(AuthGuard("jwt-monitor"))
  async getAllNotesByChieckListIdAndWebsiteId(@Param('checklistId') checklistId: string, 
                                              @Param('websiteId') websiteId: number): Promise<any> {
    return success(await this.checklistsService.findAllNotesByChecklistIdAndWebsiteId(checklistId, websiteId));
  }

  @ApiOperation({ summary: 'Save user notes' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("save-notes")
  async saveWebsiteNotes(@Body() notes: Map<number, WebSiteCriteriaNotesDTO>): Promise<any> {
    return success(await this.checklistsService.saveNotes(Object.keys(notes).map(function (key) {
      return notes[key];
    })));
  }

  @ApiOperation({ summary: 'Count conform declarations' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("count-conform-notes/:id")
  async countConformNotes(@Param("id") id:number): Promise<any> {
    return success(await this.checklistsService.countConformNotes(id));
  }

  @ApiOperation({ summary: 'Create a share code or Update share code expiry date' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("share-code/create")
  async generateShareCode(@Body() shareCode: ShareCodeDto): Promise<any> {
    return success(await this.checklistsService.generateShareCode(shareCode));
  }

  @ApiOperation({ summary: 'Check if shared code is exists and is valid' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("share-code/validate/:websiteName/:checklistId/:sharedCode")
  async validadeSharedCode(@Param("websiteName") websiteName:string,
  @Param("checklistId") checklistId:number,@Param("sharedCode") sharedCode:string): Promise<any> {
    return success(await this.checklistsService.validadeShareCode(new ShareCodeDto(websiteName,checklistId,sharedCode)));
  }
}
