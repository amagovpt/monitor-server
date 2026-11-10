import {
  Controller,
  Sse,
  UseGuards,
  Header,
  MessageEvent,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SseVisibility } from './sse-publisher.service';
import { SSEService } from './sse.service';
import { AuthenticatedUser, RoleSlugMap } from '../authentication/interfaces/types';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { CurrentUser } from '../authorization/decorators/current-user.decorator';

@Controller('notifications')
export class SSEController {
  constructor(private readonly sseService: SSEService) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  streamEvents(@CurrentUser() currentUser: AuthenticatedUser): Observable<MessageEvent> {
    const userId = currentUser?.id;
    if (!userId) {
      throw new UnauthorizedException('UserId is required to establish SSE connection');
    }
    const roleName = RoleSlugMap[currentUser?.role_slug];
    if (!roleName) {
      throw new UnauthorizedException('Role is required to establish SSE connection');
    }
    const visibilities = this.sseService.getVisibilitiesForRole(roleName);

    return this.sseService.getUserStream(userId, visibilities);
  }
}
