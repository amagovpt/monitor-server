import { Test, TestingModule } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import { SSEService } from './sse.service';
import { SsePublisherService } from './sse-publisher.service';
import { SSE_REDIS_PUBLISHER, SSE_REDIS_SUBSCRIBER } from '../../redis/sse-redis.tokens';
import { firstValueFrom, take, timeout, toArray } from 'rxjs';

describe('SseModule Integration (Testcontainers - Robust Scenarios)', () => {
  let container: StartedTestContainer;
  let redisPublisherMock: Redis;
  let redisSubscriberMock: Redis;
  let publisherService: SsePublisherService;
  let sseService: SSEService;

  beforeAll(async () => {
    container = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(6379);

    redisPublisherMock = new Redis({ host, port });
    redisSubscriberMock = new Redis({ host, port });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SSEService,
        SsePublisherService,
        {
          provide: SSE_REDIS_PUBLISHER,
          useValue: redisPublisherMock,
        },
        {
          provide: SSE_REDIS_SUBSCRIBER,
          useValue: redisSubscriberMock,
        },
      ],
    }).compile();

    publisherService = module.get<SsePublisherService>(SsePublisherService);
    sseService = module.get<SSEService>(SSEService);
  }, 60000);

  afterAll(async () => {
    await redisPublisherMock.quit();
    await redisSubscriberMock.quit();
    await container.stop();
  });

  it('should publish and receive messages across private and global channels', async () => {
    const userId = 999;
    
    const stream$ = sseService.getUserStream(userId, ['GLOBAL', 'PRIVATE']);

    await new Promise((resolve) => setTimeout(resolve, 100));

    await publisherService.notifyUser(userId, 'TEST_EVENT', { foo: 'bar' }, 'PRIVATE');

    const event = await firstValueFrom(stream$.pipe(timeout(3000)));

    expect(event).toBeDefined();
    expect((event as any).data).toMatchObject({
      event: 'TEST_EVENT',
      data: { foo: 'bar' },
    });
  });

  it('should receive messages broadcasted to the GLOBAL channel', async () => {
    const userId = 111;
    
    const stream$ = sseService.getUserStream(userId, ['GLOBAL']);
    await new Promise((resolve) => setTimeout(resolve, 100));

    await publisherService.notifyUser(userId, 'SYSTEM_ANNOUNCEMENT', { maintenance: true }, 'GLOBAL');

    const event = await firstValueFrom(stream$.pipe(timeout(3000)));

    expect(event).toBeDefined();
    expect((event as any).data).toMatchObject({
      event: 'SYSTEM_ANNOUNCEMENT',
      data: { maintenance: true },
    });
  });

  it('EDGE CASE: user without AMS visibility should NOT receive AMS messages', async () => {
    const regularUserId = 404;
    
    const stream$ = sseService.getUserStream(regularUserId, ['GLOBAL', 'PRIVATE']);
    await new Promise((resolve) => setTimeout(resolve, 100));

    await publisherService.notifyUser(regularUserId, 'AMS_SECRET_ALERT', { restricted: true }, 'AMS');

    let receivedEvent = false;
    try {
      await firstValueFrom(stream$.pipe(timeout(1000)));
      receivedEvent = true;
    } catch (error) {
      receivedEvent = false;
    }

    expect(receivedEvent).toBe(false);
  });

  it('CONCURRENCY & ISOLATION: multiple concurrent user streams should not leak data between each other', async () => {
    const userAId = 1001;
    const userBId = 2002;

    const subscriberA = new Redis({ host: container.getHost(), port: container.getMappedPort(6379) });
    const subscriberB = new Redis({ host: container.getHost(), port: container.getMappedPort(6379) });

    const sseServiceA = new SSEService(subscriberA);
    const sseServiceB = new SSEService(subscriberB);

    try {
      const streamA$ = sseServiceA.getUserStream(userAId, ['GLOBAL', 'PRIVATE']);
      const streamB$ = sseServiceB.getUserStream(userBId, ['GLOBAL', 'PRIVATE']);

      const promiseA = firstValueFrom(streamA$.pipe(take(2), toArray(), timeout(5000)));
      const promiseB = firstValueFrom(streamB$.pipe(take(2), toArray(), timeout(5000)));

      await new Promise((resolve) => setTimeout(resolve, 150));

      await Promise.all([
        publisherService.notifyUser(userAId, 'EVENT_FOR_A', { target: 'A' }, 'PRIVATE'),
        publisherService.notifyUser(userBId, 'EVENT_FOR_B', { target: 'B' }, 'PRIVATE'),
        publisherService.notifyUser(0, 'GLOBAL_ANNOUNCE', { target: 'EVERYONE' }, 'GLOBAL'),
      ]);

      const [eventsA, eventsB] = await Promise.all([promiseA, promiseB]);

      expect(eventsA).toHaveLength(2);
      const aEventsPayloads = eventsA.map((e: any) => e.data.event);
      expect(aEventsPayloads).toContain('EVENT_FOR_A');
      expect(aEventsPayloads).toContain('GLOBAL_ANNOUNCE');
      expect(aEventsPayloads).not.toContain('EVENT_FOR_B');

      expect(eventsB).toHaveLength(2);
      const bEventsPayloads = eventsB.map((e: any) => e.data.event);
      expect(bEventsPayloads).toContain('EVENT_FOR_B');
      expect(bEventsPayloads).toContain('GLOBAL_ANNOUNCE');
      expect(bEventsPayloads).not.toContain('EVENT_FOR_A');

    } finally {
      await subscriberA.quit();
      await subscriberB.quit();
    }
  }, 15000);

  it('should handle multiple sequential events across different subscribed channels', async () => {
    const userId = 777;
    
    const stream$ = sseService.getUserStream(userId, ['GLOBAL', 'PRIVATE']);
    
    const eventsPromise = firstValueFrom(
      stream$.pipe(
        take(2),
        toArray(),
        timeout(5000)
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    await publisherService.notifyUser(userId, 'EVENT_ONE', { order: 1 }, 'GLOBAL');
    await publisherService.notifyUser(userId, 'EVENT_TWO', { order: 2 }, 'PRIVATE');

    const events = await eventsPromise;

    expect(events).toHaveLength(2);
    expect((events[0] as any).data.event).toBe('EVENT_ONE');
    expect((events[1] as any).data.event).toBe('EVENT_TWO');
  }, 15000);

  it('SECURITY EDGE CASE: user A should NOT receive private messages intended for user B', async () => {
    const userAId = 111;
    const userBId = 222;
    
    const streamUserA$ = sseService.getUserStream(userAId, ['GLOBAL', 'PRIVATE']);
    await new Promise((resolve) => setTimeout(resolve, 100));

    await publisherService.notifyUser(userBId, 'SENSITIVE_DATA', { secret: 'credit_card_123' }, 'PRIVATE');

    let intercepted = false;
    try {
      await firstValueFrom(streamUserA$.pipe(timeout(1000)));
      intercepted = true;
    } catch (error) {
      intercepted = false;
    }

    expect(intercepted).toBe(false);
  });
});