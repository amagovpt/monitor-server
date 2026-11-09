import { Test, TestingModule } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import { SSEService } from './sse.service';
import { CHANNELS, SseEventEnvelope, SsePublisherService } from './sse-publisher.service';
import { SSE_REDIS_PUBLISHER, SSE_REDIS_SUBSCRIBER } from '../../redis/sse-redis.tokens';
import { firstValueFrom, take, timeout, toArray } from 'rxjs';

describe('SseModule Integration (Testcontainers - Robust Scenarios)', () => {
  let container: StartedTestContainer;
  let redisPublisherMock: Redis;
  let redisSubscriberMock: Redis;
  let publisherService: SsePublisherService;
  let sseService: SSEService;

  // O serviço faz quit() ao subscriber no onModuleDestroy; um segundo quit() numa ligação
  // já fechada rejeita com "Connection is closed", por isso fechamos sempre de forma segura.
  const safeQuit = async (client: Redis) => {
    if (client.status === 'end') return;
    await client.quit().catch(() => undefined);
  };

  // Em vez de dormir um tempo fixo, espera até o Redis reportar um subscritor no canal.
  const waitForSubscription = async (channel: string, timeoutMs = 3000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const [, count] = (await redisPublisherMock.pubsub('NUMSUB', channel)) as any;
      if (Number(count) >= 1) return;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error(`Nenhum subscritor Redis no canal ${channel}`);
  };

  beforeAll(async () => {
    container = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

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

    // Inicializa o ciclo de vida do serviço principal
    await sseService.onModuleInit();
  }, 60000);

  afterAll(async () => {
    await sseService.onModuleDestroy();
    await safeQuit(redisPublisherMock);
    await safeQuit(redisSubscriberMock);
    await container.stop();
  });

  // 1. UNICAST (PRIVATE)
  it('should publish and receive private messages with full envelope via notifyUser', async () => {
    const userId = 999;

    const stream$ = sseService.getUserStream(userId, ['GLOBAL', 'PRIVATE']);
    const eventPromise = firstValueFrom(stream$.pipe(timeout(3000)));

    await waitForSubscription(CHANNELS.PRIVATE(userId));

    await publisherService.notifyUser(userId, 'TEST_EVENT', { foo: 'bar' });

    const event = await eventPromise;

    expect(event).toBeDefined();
    expect(event.type).toBe('TEST_EVENT');
    expect(event.data).toEqual({
      event: 'TEST_EVENT',
      visibility: 'PRIVATE',
      timestamp: expect.any(String),
      payload: { foo: 'bar' },
    });
  });

  // 2. MULTICAST (GLOBAL DEFAULT)
  it('should receive messages broadcasted to the GLOBAL channel via broadcastToGroups', async () => {
    const userId = 111;

    // O canal GLOBAL é subscrito no onModuleInit, não é preciso esperar.
    const stream$ = sseService.getUserStream(userId, ['GLOBAL']);
    const eventPromise = firstValueFrom(stream$.pipe(timeout(3000)));

    await publisherService.broadcastToGroups(
      'SYSTEM_ANNOUNCEMENT',
      { maintenance: true },
      'GLOBAL',
    );

    const event = await eventPromise;

    expect(event).toBeDefined();
    expect(event.type).toBe('SYSTEM_ANNOUNCEMENT');
    expect(event.data).toEqual({
      event: 'SYSTEM_ANNOUNCEMENT',
      visibility: 'GLOBAL',
      timestamp: expect.any(String),
      payload: { maintenance: true },
    });
  });

  // 3. HYBRID (PRIVATE + GROUPS)
  it('should tag each message with its respective visibility when using notifyUserAndGroups', async () => {
    const userId = 888;

    const stream$ = sseService.getUserStream(userId, ['GLOBAL', 'PRIVATE']);
    const eventsPromise = firstValueFrom(stream$.pipe(take(2), toArray(), timeout(3000)));

    await waitForSubscription(CHANNELS.PRIVATE(userId));

    await publisherService.notifyUserAndGroups(userId, 'AUDIT_FINISHED', { websiteId: 42 }, [
      'GLOBAL',
    ]);

    const events = await eventsPromise;

    expect(events).toHaveLength(2);

    const envelopes = events.map((e) => e.data as SseEventEnvelope);
    expect(envelopes).toEqual(
      expect.arrayContaining([
        {
          event: 'AUDIT_FINISHED',
          visibility: 'GLOBAL',
          timestamp: expect.any(String),
          payload: { websiteId: 42 },
        },
        {
          event: 'AUDIT_FINISHED',
          visibility: 'PRIVATE',
          timestamp: expect.any(String),
          payload: { websiteId: 42 },
        },
      ]),
    );
  });

  // 4. ISOLAMENTO USER vs AMS
  it('EDGE CASE: user without AMS visibility should NOT receive AMS messages', async () => {
    const regularUserId = 404;

    const stream$ = sseService.getUserStream(regularUserId, ['GLOBAL', 'PRIVATE']);
    const firstEvent = firstValueFrom(stream$.pipe(timeout(3000)));

    await waitForSubscription(CHANNELS.PRIVATE(regularUserId));

    // O evento AMS é publicado primeiro e um evento de controlo (GLOBAL) a seguir.
    // O Redis mantém a ordem, logo se o AMS vazasse seria ele o primeiro a chegar.
    await publisherService.broadcastToGroups('AMS_SECRET_ALERT', { restricted: true }, 'AMS');
    await publisherService.broadcastToGroups('CONTROL_EVENT', { ok: true }, 'GLOBAL');

    const event = await firstEvent;

    expect(event.type).toBe('CONTROL_EVENT');
    expect((event.data as SseEventEnvelope).visibility).toBe('GLOBAL');
  });

  // 5. ISOLAMENTO MONITOR vs AMS
  it('ROLE ISOLATION: MONITOR user should receive MONITOR events but NEVER AMS events', async () => {
    const monitorUserId = 501;
    const visibilities = sseService.getVisibilitiesForRole('MONITOR'); // ['GLOBAL', 'PRIVATE', 'MONITOR']

    const stream$ = sseService.getUserStream(monitorUserId, visibilities);
    const eventsPromise = firstValueFrom(stream$.pipe(take(2), toArray(), timeout(3000)));

    await waitForSubscription(CHANNELS.PRIVATE(monitorUserId));

    // 1. Dispara evento exclusivo de AMS (deve ser filtrado/ignorado para o MONITOR)
    await publisherService.broadcastToGroups('AMS_AUDIT_OVERRIDE', { secretAmsData: 123 }, 'AMS');

    // 2. Dispara evento exclusivo de MONITOR (deve ser entregue)
    await publisherService.broadcastToGroups('MONITOR_QUEUE_STATUS', { queueSize: 5 }, 'MONITOR');

    // 3. Dispara evento GLOBAL como sentinela final (deve ser entregue)
    await publisherService.broadcastToGroups('GLOBAL_PING', { ok: true }, 'GLOBAL');

    const receivedEvents = await eventsPromise;

    expect(receivedEvents).toHaveLength(2);

    const eventTypes = receivedEvents.map((e) => e.type);
    expect(eventTypes).toEqual(['MONITOR_QUEUE_STATUS', 'GLOBAL_PING']);
    expect(eventTypes).not.toContain('AMS_AUDIT_OVERRIDE');

    const monitorEnvelope = receivedEvents[0].data as SseEventEnvelope;
    expect(monitorEnvelope.visibility).toBe('MONITOR');
    expect(monitorEnvelope.payload).toEqual({ queueSize: 5 });
  });

  // 6. ISOLAMENTO NIMDA (AMS) vs MONITOR
  it('ROLE ISOLATION: NIMDA (AMS) user should receive AMS events but NEVER MONITOR events', async () => {
    const nimdaUserId = 502;
    const visibilities = sseService.getVisibilitiesForRole('NIMDA'); // ['GLOBAL', 'PRIVATE', 'AMS']

    const stream$ = sseService.getUserStream(nimdaUserId, visibilities);
    const eventsPromise = firstValueFrom(stream$.pipe(take(2), toArray(), timeout(3000)));

    await waitForSubscription(CHANNELS.PRIVATE(nimdaUserId));

    // 1. Dispara evento exclusivo de MONITOR (deve ser bloqueado para NIMDA)
    await publisherService.broadcastToGroups(
      'MONITOR_WORKER_HEARTBEAT',
      { workerId: 'w-1' },
      'MONITOR',
    );

    // 2. Dispara evento exclusivo de AMS (deve ser entregue)
    await publisherService.broadcastToGroups('AMS_SYSTEM_CONFIG_CHANGED', { flag: true }, 'AMS');

    // 3. Dispara evento PRIVADO para este NIMDA como sentinela (deve ser entregue)
    await publisherService.notifyUser(nimdaUserId, 'PRIVATE_NIMDA_ALERT', { done: true });

    const receivedEvents = await eventsPromise;

    expect(receivedEvents).toHaveLength(2);

    const eventTypes = receivedEvents.map((e) => e.type);
    expect(eventTypes).toEqual(['AMS_SYSTEM_CONFIG_CHANGED', 'PRIVATE_NIMDA_ALERT']);
    expect(eventTypes).not.toContain('MONITOR_WORKER_HEARTBEAT');

    const amsEnvelope = receivedEvents[0].data as SseEventEnvelope;
    expect(amsEnvelope.visibility).toBe('AMS');
    expect(amsEnvelope.payload).toEqual({ flag: true });
  });

  // 7. MULTIPLEXAGEM ENTRE ROLES SIMULTÂNEAS
  it('CROSS-ROLE MULTIPLEXING: simultaneous broadcast to AMS and MONITOR routes strictly to corresponding role streams', async () => {
    const nimdaUserId = 601;
    const monitorUserId = 602;
    const regularUserId = 603;

    const nimdaStream$ = sseService.getUserStream(
      nimdaUserId,
      sseService.getVisibilitiesForRole('NIMDA'),
    );
    const monitorStream$ = sseService.getUserStream(
      monitorUserId,
      sseService.getVisibilitiesForRole('MONITOR'),
    );
    const userStream$ = sseService.getUserStream(
      regularUserId,
      sseService.getVisibilitiesForRole('USER'),
    );

    const nimdaPromise = firstValueFrom(nimdaStream$.pipe(take(2), toArray(), timeout(3000)));
    const monitorPromise = firstValueFrom(monitorStream$.pipe(take(2), toArray(), timeout(3000)));
    const userPromise = firstValueFrom(userStream$.pipe(take(1), toArray(), timeout(3000)));

    await Promise.all([
      waitForSubscription(CHANNELS.PRIVATE(nimdaUserId)),
      waitForSubscription(CHANNELS.PRIVATE(monitorUserId)),
      waitForSubscription(CHANNELS.PRIVATE(regularUserId)),
    ]);

    // Dispara um broadcast simultâneo para AMS e MONITOR
    await publisherService.broadcastToGroups('CROSS_ROLE_EVENT', { action: 'SYNC' }, [
      'AMS',
      'MONITOR',
    ]);

    // Dispara um sentinela GLOBAL a seguir para destravar a stream do USER e fechar as contagens
    await publisherService.broadcastToGroups('SENTINEL_GLOBAL', { end: true }, 'GLOBAL');

    const [nimdaEvents, monitorEvents, userEvents] = await Promise.all([
      nimdaPromise,
      monitorPromise,
      userPromise,
    ]);

    expect(nimdaEvents.map((e) => (e.data as SseEventEnvelope).visibility)).toEqual([
      'AMS',
      'GLOBAL',
    ]);

    expect(monitorEvents.map((e) => (e.data as SseEventEnvelope).visibility)).toEqual([
      'MONITOR',
      'GLOBAL',
    ]);

    expect(userEvents).toHaveLength(1);
    expect((userEvents[0].data as SseEventEnvelope).visibility).toBe('GLOBAL');
    expect(userEvents[0].type).toBe('SENTINEL_GLOBAL');
  });

  // 8. CONCORRÊNCIA E ISOLAMENTO MULTI-INSTÂNCIA
  it('CONCURRENCY & ISOLATION: multiple concurrent user streams should not leak data between each other', async () => {
    const userAId = 1001;
    const userBId = 2002;

    const subscriberA = new Redis({
      host: container.getHost(),
      port: container.getMappedPort(6379),
    });
    const subscriberB = new Redis({
      host: container.getHost(),
      port: container.getMappedPort(6379),
    });

    const sseServiceA = new SSEService(subscriberA);
    const sseServiceB = new SSEService(subscriberB);

    await sseServiceA.onModuleInit();
    await sseServiceB.onModuleInit();

    try {
      const streamA$ = sseServiceA.getUserStream(userAId, ['GLOBAL', 'PRIVATE']);
      const streamB$ = sseServiceB.getUserStream(userBId, ['GLOBAL', 'PRIVATE']);

      const promiseA = firstValueFrom(streamA$.pipe(take(2), toArray(), timeout(5000)));
      const promiseB = firstValueFrom(streamB$.pipe(take(2), toArray(), timeout(5000)));

      await Promise.all([
        waitForSubscription(CHANNELS.PRIVATE(userAId)),
        waitForSubscription(CHANNELS.PRIVATE(userBId)),
      ]);

      await Promise.all([
        publisherService.notifyUser(userAId, 'EVENT_FOR_A', { target: 'A' }),
        publisherService.notifyUser(userBId, 'EVENT_FOR_B', { target: 'B' }),
        publisherService.broadcastToGroups('GLOBAL_ANNOUNCE', { target: 'EVERYONE' }, 'GLOBAL'),
      ]);

      const [eventsA, eventsB] = await Promise.all([promiseA, promiseB]);

      expect(eventsA).toHaveLength(2);
      const aEventTypes = eventsA.map((e) => e.type);
      expect(aEventTypes).toContain('EVENT_FOR_A');
      expect(aEventTypes).toContain('GLOBAL_ANNOUNCE');
      expect(aEventTypes).not.toContain('EVENT_FOR_B');

      expect(eventsB).toHaveLength(2);
      const bEventTypes = eventsB.map((e) => e.type);
      expect(bEventTypes).toContain('EVENT_FOR_B');
      expect(bEventTypes).toContain('GLOBAL_ANNOUNCE');
      expect(bEventTypes).not.toContain('EVENT_FOR_A');
    } finally {
      await sseServiceA.onModuleDestroy();
      await sseServiceB.onModuleDestroy();
      await safeQuit(subscriberA);
      await safeQuit(subscriberB);
    }
  }, 15000);

  // 9. ORDEM SEQUENCIAL ENTRE CANAIS
  it('should handle multiple sequential events across different subscribed channels', async () => {
    const userId = 777;

    const stream$ = sseService.getUserStream(userId, ['GLOBAL', 'PRIVATE']);
    const eventsPromise = firstValueFrom(stream$.pipe(take(2), toArray(), timeout(5000)));

    await waitForSubscription(CHANNELS.PRIVATE(userId));

    await publisherService.broadcastToGroups('EVENT_ONE', { order: 1 }, 'GLOBAL');
    await publisherService.notifyUser(userId, 'EVENT_TWO', { order: 2 });

    const events = await eventsPromise;

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('EVENT_ONE');
    expect(events[0].data).toEqual({
      event: 'EVENT_ONE',
      visibility: 'GLOBAL',
      timestamp: expect.any(String),
      payload: { order: 1 },
    });

    expect(events[1].type).toBe('EVENT_TWO');
    expect(events[1].data).toEqual({
      event: 'EVENT_TWO',
      visibility: 'PRIVATE',
      timestamp: expect.any(String),
      payload: { order: 2 },
    });
  }, 15000);

  // 10. ISOLAMENTO ESTRITO ENTRE CANAIS PRIVADOS
  it('SECURITY EDGE CASE: user A should NOT receive private messages intended for user B', async () => {
    const userAId = 111;
    const userBId = 222;

    const streamUserA$ = sseService.getUserStream(userAId, ['GLOBAL', 'PRIVATE']);
    const firstEvent = firstValueFrom(streamUserA$.pipe(timeout(3000)));

    await waitForSubscription(CHANNELS.PRIVATE(userAId));

    await publisherService.notifyUser(userBId, 'SENSITIVE_DATA', { secret: 'credit_card_123' });
    await publisherService.broadcastToGroups('CONTROL_EVENT', { ok: true }, 'GLOBAL');

    const event = await firstEvent;

    expect(event.type).toBe('CONTROL_EVENT');
    expect((event.data as SseEventEnvelope).payload).toEqual({ ok: true });
    expect(JSON.stringify(event.data)).not.toContain('credit_card_123');
  });
  it('ISOLATION STRESS: high-frequency alternating events between MONITOR and AMS channels must not leak', async () => {
    const monitorUserId = 701;
    const amsUserId = 702;

    const monitorStream$ = sseService.getUserStream(
      monitorUserId,
      sseService.getVisibilitiesForRole('MONITOR'),
    );
    const amsStream$ = sseService.getUserStream(
      amsUserId,
      sseService.getVisibilitiesForRole('NIMDA'), // NIMDA tem acesso a AMS
    );

    // Cada um espera receber exatamente 3 eventos legítimos do seu domínio
    const monitorPromise = firstValueFrom(monitorStream$.pipe(take(3), toArray(), timeout(4000)));
    const amsPromise = firstValueFrom(amsStream$.pipe(take(3), toArray(), timeout(4000)));

    await Promise.all([
      waitForSubscription(CHANNELS.PRIVATE(monitorUserId)),
      waitForSubscription(CHANNELS.PRIVATE(amsUserId)),
    ]);

    // Dispara uma rajada alternada e cruzada de eventos
    await publisherService.broadcastToGroups('MONITOR_METRIC_1', { val: 1 }, 'MONITOR');
    await publisherService.broadcastToGroups('AMS_AUDIT_1', { secure: true }, 'AMS');
    await publisherService.broadcastToGroups('MONITOR_METRIC_2', { val: 2 }, 'MONITOR');
    await publisherService.broadcastToGroups('AMS_AUDIT_2', { secure: true }, 'AMS');

    // Evento global para garantir que ambos fecham o take(3) se contarmos com o GLOBAL
    await publisherService.broadcastToGroups('GLOBAL_SYNC', { sync: true }, 'GLOBAL');

    const [monitorEvents, amsEvents] = await Promise.all([monitorPromise, amsPromise]);

    // Validações estritas para o MONITOR
    const monitorTypes = monitorEvents.map((e) => e.type);
    expect(monitorTypes).toEqual(['MONITOR_METRIC_1', 'MONITOR_METRIC_2', 'GLOBAL_SYNC']);
    monitorEvents.forEach((e) => {
      const env = e.data as SseEventEnvelope;
      expect(env.visibility).not.toBe('AMS');
    });

    // Validações estritas para o AMS (NIMDA)
    const amsTypes = amsEvents.map((e) => e.type);
    expect(amsTypes).toEqual(['AMS_AUDIT_1', 'AMS_AUDIT_2', 'GLOBAL_SYNC']);
    amsEvents.forEach((e) => {
      const env = e.data as SseEventEnvelope;
      expect(env.visibility).not.toBe('MONITOR');
    });
  });

  it('SECURITY BOUNDARY: a user with USER role should be completely deaf to both AMS and MONITOR broadcasts', async () => {
    const standardUserId = 801;

    // USER só tem ['GLOBAL', 'PRIVATE']
    const stream$ = sseService.getUserStream(
      standardUserId,
      sseService.getVisibilitiesForRole('USER'),
    );

    // O único evento que deve furar a barreira é o GLOBAL sentinela
    const eventPromise = firstValueFrom(stream$.pipe(timeout(3000)));

    await waitForSubscription(CHANNELS.PRIVATE(standardUserId));

    // Inunda o Redis com eventos restritos de AMS e MONITOR
    await publisherService.broadcastToGroups('AMS_INTERNAL_STATE', { token: 'secret-ams' }, 'AMS');
    await publisherService.broadcastToGroups('MONITOR_SYSTEM_HEALTH', { cpu: 99 }, 'MONITOR');

    // Envia o evento legítimo que o USER tem permissão para ver
    await publisherService.broadcastToGroups('USER_WELCOME', { message: 'hello' }, 'GLOBAL');

    const event = await eventPromise;

    expect(event).toBeDefined();
    expect(event.type).toBe('USER_WELCOME');

    const envelope = event.data as SseEventEnvelope;
    expect(envelope.visibility).toBe('GLOBAL');
    expect(envelope.payload).toEqual({ message: 'hello' });

    // Garante que o payload não contém vestígios de dados confidenciais das outras visibilidades
    expect(JSON.stringify(event)).not.toContain('secret-ams');
    expect(JSON.stringify(event)).not.toContain('cpu');
  });

  it('DYNAMIC ROLE TRANSITION / MULTI-STREAM: same user session querying different role scopes maintains proper channel boundaries', async () => {
    const userId = 901;

    // Simula o mesmo utilizador a abrir uma stream como MONITOR e depois outra como NIMDA (simulando re-auth ou painéis distintos)
    const monitorStream$ = sseService.getUserStream(userId, ['MONITOR', 'GLOBAL']);
    const amsStream$ = sseService.getUserStream(userId, ['AMS', 'GLOBAL']);

    const monitorPromise = firstValueFrom(monitorStream$.pipe(take(1), timeout(3000)));
    const amsPromise = firstValueFrom(amsStream$.pipe(take(1), timeout(3000)));

    // Dispara eventos específicos para ambos os canais em simultâneo
    await publisherService.broadcastToGroups('MONITOR_PING', { ping: 'mon' }, 'MONITOR');
    await publisherService.broadcastToGroups('AMS_PING', { ping: 'ams' }, 'AMS');

    const [monEvent, amsEvent] = await Promise.all([monitorPromise, amsPromise]);

    expect(monEvent.type).toBe('MONITOR_PING');
    expect((monEvent.data as SseEventEnvelope).visibility).toBe('MONITOR');

    expect(amsEvent.type).toBe('AMS_PING');
    expect((amsEvent.data as SseEventEnvelope).visibility).toBe('AMS');
  });
});
