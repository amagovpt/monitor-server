import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth, 
  ApiParam, 
  ApiBody 
} from "@nestjs/swagger";
import { EvaluationAspect } from "./manual-evaluation.entity";
import { ManualEvaluationResponseDTO } from "./dto/manual-evaluation-response.dto";

export const ManualEvaluationDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("manual-evaluation"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" }),
      ApiResponse({ status: 500, description: "Internal Server Error" })
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Create a new aspect evaluation",
        description: "Supports content, functional, or transaction aspect types" 
      }),
      ApiParam({ name: 'type', enum: EvaluationAspect, required: true, description: 'Evaluation aspect type' }),
      ApiBody({ 
        schema: { 
          type: 'object', 
          properties: { jsonData: { type: 'object' } },
          required: ['jsonData']
        } 
      }),
      ApiResponse({ status: 201, description: "Evaluation created successfully", type: Boolean }),
      ApiResponse({ status: 400, description: "Invalid aspect type or payload" }),
      ApiResponse({ status: 500, description: "Failed to create evaluation" }),
      HttpCode(201)
    ),

  findAllByAspect: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all evaluations for a specific aspect type" }),
      ApiParam({ name: 'type', enum: EvaluationAspect, required: true, description: 'Evaluation aspect type' }),
      ApiResponse({ status: 200, description: "Evaluations retrieved successfully", type: [ManualEvaluationResponseDTO] }),
      ApiResponse({ status: 400, description: "Invalid aspect type" }),
      HttpCode(200)
    ),

  findAllByWebsite: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all evaluations for a specific website" }),
      ApiParam({ name: 'id', type: Number, required: true, description: 'Unique identifier of the website' }),
      ApiResponse({ status: 200, description: "Evaluations retrieved successfully", type: [ManualEvaluationResponseDTO] }),
      ApiResponse({ status: 400, description: "Invalid website ID" }),
      HttpCode(200)
    ),
};
