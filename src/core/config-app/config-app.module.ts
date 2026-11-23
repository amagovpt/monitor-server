import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV == 'production' ? 'prod' : 'dev'}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'staging', 'test').required(),
        AMS_ENV: Joi.string().valid('DEV', 'PPR', 'PROD').required(),
        APP_AUTH_METHOD: Joi.string().valid('local', 'gov').required(),
        SECRET_KEY: Joi.string().required(),

        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().allow('').default(''),
        REDIS_DB_BULL: Joi.number().required(),
        REDIS_DB_MONITOR: Joi.number().required(),
        BULL_BOARD_ROUTE: Joi.string().default('/admin/queues'),

        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(3306),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),

        PAGINATION_MAX_LIMIT: Joi.number().integer().min(10).max(100).default(100),
        PAGINATION_DEFAULT_LIMIT: Joi.number().integer().min(10).max(100).default(10),
        IP_BLACKLIST_RANGES: Joi.string().default(''),
        FGA_API_URL: Joi.string().required(),
        FGA_STORE_ID: Joi.string().required(),
        FGA_MODEL_ID: Joi.string().required(),
      }),
    }),
  ],
  exports: [ConfigModule],
})
export class ConfigAppModule {}
