import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { Redis } from 'ioredis';
import { DESTRUCTION_CHALLENGE_KEY } from '../decorators/destruction-challenge.decorator';
import { REDIS_CLIENT } from 'src/redis/types';

@Injectable()
export class DestructionChallengeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isRequired = this.reflector.getAllAndOverride<boolean>(DESTRUCTION_CHALLENGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isRequired) {
      return true;
    }

    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();

    const userId = (req as any).user?.id || req.ip;
    const resourceId = req.params.id;

    if (!resourceId) {
      throw new HttpException(
        'Missing route parameter id for destructive challenge validation',
        HttpStatus.BAD_REQUEST,
      );
    }

    const redisKey = `delete_challenge:${userId}:${resourceId}`;
    const confirmationHeader = req.headers['x-confirmation-code'] as string;

    // PHASE 1: If the client has not yet sent the confirmation header -> Generate Challenge
    if (!confirmationHeader) {
      const digitCode = Math.floor(100000 + Math.random() * 900000).toString();
      const code = digitCode;
      const ttl = 60;

      await this.redis.set(redisKey, code, 'EX', ttl);

      res.setHeader(
        'Access-Control-Expose-Headers',
        'X-Destruction-Challenge, X-Challenge-Expires-In',
      );
      res.setHeader('X-Destruction-Challenge', code);
      res.setHeader('X-Challenge-Expires-In', ttl.toString());

      throw new HttpException(
        {
          error: 'precondition_required',
          message:
            'Confirmation required. Check the X-Destruction-Challenge header and resend it via X-Confirmation-Code.',
        },
        HttpStatus.PRECONDITION_REQUIRED, // 428
      );
    }

    // PHASE 2: The client sent the header -> Atomic read and removal
    const expectedCode = await this.redis.getdel(redisKey);

    if (!expectedCode) {
      throw new HttpException(
        {
          error: 'challenge_expired',
          message:
            'Challenge expired or nonexistent. Trigger the request again to obtain a new code.',
        },
        HttpStatus.GONE, // 410
      );
    }

    const submittedBuffer = Buffer.from(confirmationHeader.trim().toUpperCase());
    const expectedBuffer = Buffer.from(expectedCode);

    if (
      submittedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(submittedBuffer, expectedBuffer)
    ) {
      throw new HttpException(
        {
          error: 'invalid_confirmation_code',
          message: 'Invalid confirmation code.',
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Valid code consumed atomically -> Allows passage to the Controller
    return true;
  }
}
