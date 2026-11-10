import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';
import { DbUniqueConstraint, UNIQUE_CONSTRAINT_MAPPINGS } from './db-unique-constraints.type';

const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';
const POSTGRES_FOREIGN_KEY_VIOLATION_CODE = '23503'; // <-- Código para FK violations
const POSTGRES_NOT_NULL_VIOLATION_CODE = '23502';
const POSTGRES_CHECK_VIOLATION_CODE = '23514';
const POSTGRES_INVALID_TEXT_REPRESENTATION_CODE = '22P02';

interface PostgresErrorFields {
  code?: string;
  detail?: string;
  constraint?: string;
  column?: string;
}

@Catch(QueryFailedError)
export class DbConstraintExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DbConstraintExceptionFilter.name);

  catch(
    exception: QueryFailedError & PostgresErrorFields & { driverError?: PostgresErrorFields },
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Os campos do Postgres podem estar no próprio erro ou em driverError
    const driverError: PostgresErrorFields = exception.driverError ?? {};
    const code = exception.code ?? driverError.code;
    const pgDetail = exception.detail ?? driverError.detail;
    const pgConstraint = exception.constraint ?? driverError.constraint;
    const pgColumn = exception.column ?? driverError.column;

    // 1. Tratamento de Unique Constraints (23505)
    if (code === POSTGRES_UNIQUE_VIOLATION_CODE) {
      const detail = pgDetail || '';
      const mapConflict: Record<string, string> = {};
      const constraints = Object.values(DbUniqueConstraint) as DbUniqueConstraint[];

      for (const constraint of constraints) {
        if (detail.includes(constraint)) {
          const mapping = UNIQUE_CONSTRAINT_MAPPINGS[constraint];
          mapConflict[mapping.property] = mapping.message;
        }
      }

      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: 'Duplicate key value violates unique constraint',
        errors: mapConflict,
      });
    }

    // 2. Tratamento de Foreign Key Constraints (23503)
    if (code === POSTGRES_FOREIGN_KEY_VIOLATION_CODE) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'A referenced entity (foreign key) does not exist or cannot be modified.',
        constraint: pgConstraint || 'unknown_fk',
      });
    }

    // 3. Outros erros de validação de dados (NOT NULL, CHECK, tipo inválido)
    if (
      code === POSTGRES_NOT_NULL_VIOLATION_CODE ||
      code === POSTGRES_CHECK_VIOLATION_CODE ||
      code === POSTGRES_INVALID_TEXT_REPRESENTATION_CODE
    ) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Invalid data for database operation.',
        constraint: pgConstraint,
        column: pgColumn,
      });
    }

    // 4. Fallback genérico para outras falhas de base de dados
    this.logger.error(
      `Unhandled database error (code: ${code ?? 'unknown'}): ${exception.message}`,
      exception.stack,
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
