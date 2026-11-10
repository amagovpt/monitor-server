import { Global, Module } from '@nestjs/common';
import { SSEController } from './sse.controller';
import { SSEService } from './sse.service';
import { SsePublisherService } from './sse-publisher.service';
import { SseRedisModule } from '../../redis/sse-redis.module';

@Global()
@Module({
  imports: [SseRedisModule],
  controllers: [SSEController],
  providers: [SSEService, SsePublisherService],
  exports: [SSEService, SsePublisherService],
})
export class SseModule {}