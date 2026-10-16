import { Test, TestingModule } from '@nestjs/testing';
import { SSEService } from './sse.service';
import {  SSE_REDIS_SUBSCRIBER } from '../../redis/sse-redis.tokens';
import { SseVisibility } from './sse-publisher.service';

describe('SSEService', () => {
  let service: SSEService;
  let mockRedisSubscriber: any;

  beforeEach(async () => {
    mockRedisSubscriber = {
      subscribe: jest.fn((...args) => {
        const callback = args[args.length - 1];
        if (typeof callback === 'function') callback(null);
      }),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SSEService,
        {
          provide: SSE_REDIS_SUBSCRIBER,
          useValue: mockRedisSubscriber,
        },
      ],
    }).compile();

    service = module.get<SSEService>(SSEService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should subscribe to correct channels based on visibilities and userId', (done) => {
    const userId = 123;
    const visibilities: SseVisibility[] = ['GLOBAL', 'PRIVATE'];

    const observable = service.getUserStream(userId, visibilities);

    expect(mockRedisSubscriber.subscribe).toHaveBeenCalledWith(
      'global:events',
      'user:events:123',
      expect.any(Function),
    );

    const subscription = observable.subscribe({
      next: (event) => {
        expect(event.data).toEqual({ message: 'test' });
        subscription.unsubscribe();
        done();
      },
    });

    const messageHandler = mockRedisSubscriber.on.mock.calls.find(
      (call: [string, Function]) => call[0] === 'message',
    )[1];

    messageHandler('user:events:123', JSON.stringify({ message: 'test' }));
  });
});