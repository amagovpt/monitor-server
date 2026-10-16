import { Controller, Sse, UseGuards, Header, Res } from '@nestjs/common';
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
      throw new Error('UserId is required to establish SSE connection');
    }
    const roleName = RoleSlugMap[currentUser?.role_slug];
    if (!roleName) {
      throw new Error('Role is required to establish SSE connection');
    }
    const visibilities = this.getVisibilitiesForRole(roleName);
    console.log(
      `User ${userId} with role ${roleName} has visibilities:`,
      JSON.stringify(visibilities),
    );
    return this.sseService.getUserStream(userId, visibilities);
  }

  private getVisibilitiesForRole(role: string): SseVisibility[] {
    switch (role.toUpperCase()) {
      case 'NIMDA':
        return ['GLOBAL', 'PRIVATE', 'AMS'];

      case 'MONITOR':
        return ['GLOBAL', 'PRIVATE', 'MONITOR'];

      case 'USER':
      default:
        return ['GLOBAL', 'PRIVATE'];
    }
  }
}
