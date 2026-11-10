import { Module } from '@nestjs/common';
import { DatabaseCounterListenerService } from './database-listener.service';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [SseModule],
  providers: [DatabaseCounterListenerService],
  exports: [DatabaseCounterListenerService],
})
export class ListenerModule {}
