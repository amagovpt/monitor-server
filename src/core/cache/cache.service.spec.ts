import { Test, TestingModule } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/types';
import { AppCacheService } from './cache.service';

describe('AppCacheService Integration (Testcontainers + ioredis)', () => {
  let redisContainer: StartedTestContainer;
  let cacheService: AppCacheService;
  let redisClient: Redis;

  beforeAll(async () => {
    redisContainer = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

    const host = redisContainer.getHost();
    const port = redisContainer.getMappedPort(6379);

    redisClient = new Redis({
      host,
      port,
      db: 2, // Isola na base de dados 2
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        AppCacheService,
        {
          provide: REDIS_CLIENT,
          useValue: redisClient,
        },
      ],
    }).compile();

    cacheService = moduleFixture.get<AppCacheService>(AppCacheService);
  }, 60000);

  afterAll(async () => {
    if (redisClient) {
      await redisClient.quit();
    }
    if (redisContainer) {
      await redisContainer.stop();
    }
  });

  beforeEach(async () => {
    await redisClient.flushdb();
  });

  describe('Bootstrap & Sanity Check', () => {
    it('deve executar o onApplicationBootstrap e validar o ping inicial com sucesso', async () => {
      await expect(cacheService.onApplicationBootstrap()).resolves.not.toThrow();

      const pingVal = await cacheService.get('cache:ping_test');
      expect(pingVal).toEqual({ status: 'ok' });
    });
  });

  describe('Operações CRUD com Tipos Complexos', () => {
    it('deve persistir e recuperar estruturas JSON aninhadas e arrays de quartis', async () => {
      const complexAnalytics = {
        websiteId: 3,
        score: 5.2,
        errorsDistribution: [
          { key: 'table_03', pagesCount: 46, occurrenceCount: 4832 },
          { key: 'img_01b', pagesCount: 46, occurrenceCount: 4742 },
        ],
        quartiles: [{ interval: { lower: 1, upper: 51 }, total: 6956, percentage: 25 }],
      };

      await cacheService.set('cache:metrics:3', complexAnalytics, 100);

      const retrieved = await cacheService.get('cache:metrics:3');
      expect(retrieved).toEqual(complexAnalytics);
    });

    it('deve retornar a string crua se o valor guardado no Redis não for JSON válido', async () => {
      // Escreve diretamente uma string não-JSON no Redis
      await redisClient.set('cache:raw_text', 'plain_unformatted_string');

      const val = await cacheService.get('cache:raw_text');
      expect(val).toBe('plain_unformatted_string');
    });

    it('deve retornar null para chaves inexistentes no Redis', async () => {
      const val = await cacheService.get('cache:key_does_not_exist');
      expect(val).toBeNull();
    });

    it('deve remover chave com sucesso via del()', async () => {
      await cacheService.set('cache:delete_me', { toDelete: true }, 60);
      expect(await cacheService.get('cache:delete_me')).not.toBeNull();

      const deletedCount = await cacheService.del('cache:delete_me');
      expect(deletedCount).toBe(1);
      expect(await cacheService.get('cache:delete_me')).toBeNull();
    });

    it('deve suportar persistência sem expiração se ttlSeconds for 0', async () => {
      await cacheService.set('cache:permanent', { persistent: true }, 0);

      const ttl = await redisClient.ttl('cache:permanent');
      expect(ttl).toBe(-1); // -1 no Redis significa sem expiração (chave persistente)

      const val = await cacheService.get('cache:permanent');
      expect(val).toEqual({ persistent: true });
    });
  });

  describe('Mecânica Física de TTL no Redis', () => {
    it('deve aplicar o comando EX e expirar fisicamente a chave no Redis', async () => {
      // 1 segundo de TTL
      await cacheService.set('cache:expires_fast', { active: true }, 1);

      // Chave existe no Redis imediatamente após gravação
      expect(await cacheService.get('cache:expires_fast')).toEqual({ active: true });

      const ttlInitial = await redisClient.ttl('cache:expires_fast');
      expect(ttlInitial).toBeGreaterThan(0);

      // Aguarda 1.2 segundos para garantir passagem pelo scheduler do Redis
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Deve devolver null
      expect(await cacheService.get('cache:expires_fast')).toBeNull();
    });
  });
});
