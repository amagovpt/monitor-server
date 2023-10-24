import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { CriticalAspectService } from "./critical-aspects.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiTags, ApiResponse, ApiOperation } from "@nestjs/swagger";
import { WebSiteCriteriaNotesDTO } from "./dto/website-criteria-notes.dto";

//@ApiBasicAuth()
@ApiTags('critical-aspects')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("critical-aspects")
@UseInterceptors(LoggingInterceptor)
export class CriticalAspectsController {
  constructor(private readonly userService: CriticalAspectService) { }

  @ApiOperation({ summary: 'Find all users MyMonitor' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  //@UseGuards(AuthGuard("jwt-admin"))
  @Get("all")
  async getAllMyMonitorUsers(): Promise<any> {
    return success(await this.userService.findAllByWebsite(1));
  }

  @ApiOperation({ summary: 'Save user notes' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @Post("save-notes")
  async saveWebsiteNotes(@Body() notes: Map<number, WebSiteCriteriaNotesDTO>): Promise<any> {
    return success(await this.userService.saveNotes(Object.keys(notes).map(function (key) {
      return notes[key];
    })));
  }

}
