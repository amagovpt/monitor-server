import { Test, TestingModule } from '@nestjs/testing';
import { SSEService } from './sse.service';
import { SSE_REDIS_SUBSCRIBER } from '../../redis/sse-redis.tokens';
import { CHANNELS, SseEventEnvelope } from './sse-publisher.service';
import { firstValueFrom, take, timeout, toArray } from 'rxjs';
import { BadRequestException } from '@nestjs/common';

describe('SSEService (Unit Tests)', () => {
  let sseService: SSEService;
  let redisSubscriberMock: any;

  beforeEach(async () => {
    // Mock do ioredis subscriber
    redisSubscriberMock = {
      on: jest.fn(),
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SSEService,
        {
          provide: SSE_REDIS_SUBSCRIBER,
          useValue: redisSubscriberMock,
        },
      ],
    }).compile();

    sseService = module.get<SSEService>(SSEService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit & Static Subscriptions', () => {
    it('should subscribe to static channels on init', async () => {
      await sseService.onModuleInit();

      expect(redisSubscriberMock.subscribe).toHaveBeenCalledWith(
        CHANNELS.AMS(),
        CHANNELS.MONITOR(),
        CHANNELS.GLOBAL(),
      );
      expect(redisSubscriberMock.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('getUserStream & Dynamic Private Channel Reference Counting', () => {
    it('should throw BadRequestException if userId is invalid for a private stream', async () => {
      await sseService.onModuleInit();

      expect(() => {
        sseService.getUserStream(-1, ['PRIVATE']);
      }).toThrow(BadRequestException);
    });

    it('should subscribe to private channel when stream is opened and unsubscribe when finalized', async () => {
      await sseService.onModuleInit();
      const userId = 123;
      const privateChannel = CHANNELS.PRIVATE(userId);

      const stream$ = sseService.getUserStream(userId, ['PRIVATE']);

      // Abre a subscrição (subscribing to observable)
      const subscription = stream$.subscribe();

      // Verifica se chamou o subscribe no Redis para o canal privado
      expect(redisSubscriberMock.subscribe).toHaveBeenCalledWith(privateChannel);

      // Fecha a stream (finalize / teardown)
      subscription.unsubscribe();

      // Verifica se chamou o unsubscribe no Redis
      expect(redisSubscriberMock.unsubscribe).toHaveBeenCalledWith(privateChannel);
    });

    it('should filter incoming messages based on user visibilities', async () => {
      await sseService.onModuleInit();
      const userId = 456;

      // Obtém o listener de 'message' registado no ioredis mock
      const messageCallback = redisSubscriberMock.on.mock.calls.find(
        (call: any[]) => call[0] === 'message',
      )[1];

      const stream$ = sseService.getUserStream(userId, ['GLOBAL', 'PRIVATE']);
      const eventsPromise = firstValueFrom(stream$.pipe(take(2), toArray(), timeout(1000)));

      // Simula a chegada de mensagens do Redis em canais diferentes
      const globalEnvelope: SseEventEnvelope = {
        event: 'GLOBAL_EVT',
        visibility: 'GLOBAL',
        timestamp: new Date().toISOString(),
        payload: { id: 1 },
      };

      const privateEnvelope: SseEventEnvelope = {
        event: 'PRIVATE_EVT',
        visibility: 'PRIVATE',
        timestamp: new Date().toISOString(),
        payload: { id: 2 },
      };

      const otherUserPrivateEnvelope: SseEventEnvelope = {
        event: 'SECRET_EVT',
        visibility: 'PRIVATE',
        timestamp: new Date().toISOString(),
        payload: { id: 3 },
      };

      // Dispara os eventos através do mock do Redis
      messageCallback(CHANNELS.GLOBAL(), JSON.stringify(globalEnvelope));
      messageCallback(CHANNELS.PRIVATE(userId), JSON.stringify(privateEnvelope));
      messageCallback(CHANNELS.PRIVATE(9999), JSON.stringify(otherUserPrivateEnvelope)); // Deve ser ignorado

      const events = await eventsPromise;

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('GLOBAL_EVT');
      expect((events[0].data as SseEventEnvelope).payload).toEqual({ id: 1 });

      expect(events[1].type).toBe('PRIVATE_EVT');
      expect((events[1].data as SseEventEnvelope).payload).toEqual({ id: 2 });
    });
  });

  describe('getVisibilitiesForRole', () => {
    it('should return correct visibilities for NIMDA role', () => {
      const visibilities = sseService.getVisibilitiesForRole('NIMDA');
      expect(visibilities).toEqual(['GLOBAL', 'PRIVATE', 'AMS']);
    });

    it('should return correct visibilities for MONITOR role', () => {
      const visibilities = sseService.getVisibilitiesForRole('MONITOR');
      expect(visibilities).toEqual(['GLOBAL', 'PRIVATE', 'MONITOR']);
    });

    it('should return default visibilities for standard USER role or unknown roles', () => {
      expect(sseService.getVisibilitiesForRole('USER')).toEqual(['GLOBAL', 'PRIVATE']);
      expect(sseService.getVisibilitiesForRole('UNKNOWN_ROLE')).toEqual(['GLOBAL', 'PRIVATE']);
    });
  });
});
