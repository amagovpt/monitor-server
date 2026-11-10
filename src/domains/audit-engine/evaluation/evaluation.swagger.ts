import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
  ApiParam,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';

import { Evaluation } from './entities/evaluation.entity';
import { EvaluationQueryDTO } from './dto/request/evaluation-request.dto';
import { EvaluationTriggerDTO } from './dto/evaluation-trigger.dto';
import { EvaluationDTO } from './dto/evaluation.dto';

export const EvaluationDocs = {
  controller: () =>
    applyDecorators(
      ApiBearerAuth(),
      ApiTags('evaluations'),
      ApiExtraModels(Evaluation),
      ApiResponse({ status: 403, description: 'Forbidden' }),
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: 'Get all evaluations that you are authorized to view' }),
      ApiParam({ name: 'websiteId', type: Number, description: 'Website identifier' }),
      ApiParam({ name: 'pageId', type: Number, description: 'Page identifier' }),
      ApiQuery({ type: EvaluationQueryDTO }),
      ApiResponse({
        status: 200,
        description: 'Evaluations retrieved successfully',
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(Evaluation) },
            },
            count: { type: 'number' },
          },
          required: ['data', 'count'],
        },
      }),
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get a specific evaluation result',
      }),
      ApiParam({ name: 'websiteId', type: Number, description: 'Website identifier' }),
      ApiParam({ name: 'pageId', type: Number, description: 'Page identifier' }),
      ApiParam({ name: 'evaluationId', type: Number, description: 'Evaluation identifier' }),
      ApiResponse({
        status: 200,
        description: 'Evaluation retrieved successfully',
        type: EvaluationDTO,
      }),
      ApiResponse({ status: 404, description: 'Evaluation not found' }),
    ),

  findPageEvaluationDetails: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get evaluation details (JSON or HTML) for a specific page',
        description:
          'Streams the evaluation result as a gzipped JSON payload (/nodes) or a gzipped HTML document (/html).',
      }),
      ApiParam({ name: 'websiteId', type: Number, description: 'Website identifier' }),
      ApiParam({ name: 'pageId', type: Number, description: 'Page identifier' }),
      ApiParam({ name: 'evaluationId', type: Number, description: 'Evaluation identifier' }),
      ApiResponse({
        status: 200,
        description: 'Evaluation details streamed successfully',
        content: {
          'application/json': { schema: { type: 'object' } },
          'text/html': { schema: { type: 'string' } },
        },
      }),
      ApiResponse({ status: 404, description: 'Evaluation not found' }),
    ),

  uploadExternalEvaluation: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Upload external evaluation results from the AccessMonitor Extension on My Monitor',
      }),
      ApiParam({ name: 'websiteId', type: Number, description: 'Website identifier' }),
      ApiParam({ name: 'pageId', type: Number, description: 'Page identifier' }),
      ApiBody({
        description: 'Raw AccessMonitor evaluation payload',
        schema: { type: 'string' },
      }),
      ApiResponse({
        status: 201,
        description: 'External evaluation uploaded successfully',
      }),
      ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ),

  evaluate: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Trigger an evaluation for the given targets',
      }),
      ApiBody({ type: EvaluationTriggerDTO }),
      ApiResponse({
        status: 201,
        description: 'Evaluation triggered successfully',
      }),
      ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Delete a specific evaluation',
      }),
      ApiParam({ name: 'websiteId', type: Number, description: 'Website identifier' }),
      ApiParam({ name: 'pageId', type: Number, description: 'Page identifier' }),
      ApiParam({ name: 'evaluationId', type: Number, description: 'Evaluation identifier' }),
      ApiResponse({
        status: 200,
        description: 'Evaluation deleted successfully',
      }),
      ApiResponse({ status: 404, description: 'Evaluation not found' }),
    ),
  deleteFrozen: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Delete a frozen evaluation with a valid challenge key',
      }),
      ApiParam({ name: 'websiteId', type: Number, description: 'Website identifier' }),
      ApiParam({ name: 'pageId', type: Number, description: 'Page identifier' }),
      ApiParam({ name: 'evaluationId', type: Number, description: 'Evaluation identifier' }),
      ApiParam({
        name: 'challengeKey',
        type: String,
        description: 'Destruction challenge key required to authorize the deletion',
      }),
      ApiResponse({
        status: 200,
        description: 'Frozen evaluation deleted successfully',
      }),
      ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
      ApiResponse({ status: 404, description: 'Evaluation not found' }),
    ),
};
