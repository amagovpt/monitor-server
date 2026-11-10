import { BadRequestException, Injectable } from '@nestjs/common';
import { ExportResource } from '../queries/type';
import { EXPORT_QUERIES } from '../queries/export.query';

@Injectable()
export class ExportQueryRegistryService {
  private readonly RESOURCES_REQUIRING_ENTITY_ID = [
    ExportResource.DIRECTORY,
    ExportResource.TAG,
    ExportResource.WEBSITE,
    ExportResource.INSTITUTION,
    ExportResource.LATEST_PAGES_EVALUATION,
    ExportResource.ALL_PAGES_EVALUATIONS,
  ];

  resolveQuery(resource: ExportResource, entityId?: string): string {
    if (this.RESOURCES_REQUIRING_ENTITY_ID.includes(resource) && !entityId) {
      throw new BadRequestException(`Resource '${resource}' requires an entityId parameter`);
    }

    switch (resource) {
      case ExportResource.AMS:
        return EXPORT_QUERIES.globalAMS;

      case ExportResource.OBSERVATORY:
        return EXPORT_QUERIES.globalObservatory;

      case ExportResource.GLOBAL:
        return EXPORT_QUERIES.globalAMS; // or create a separate global query

      case ExportResource.DIRECTORY:
        return EXPORT_QUERIES.globalDirectory;

      case ExportResource.TAG:
        return EXPORT_QUERIES.globalTag;

      case ExportResource.WEBSITE:
        return EXPORT_QUERIES.globalWebsite;

      case ExportResource.INSTITUTION:
        return EXPORT_QUERIES.globalEntity;

      case ExportResource.LATEST_PAGES_EVALUATION:
        return EXPORT_QUERIES.latestPageEvaluation;

      case ExportResource.ALL_PAGES_EVALUATIONS:
        return EXPORT_QUERIES.allPagesEvaluations;

      default:
        throw new BadRequestException(`Unsupported export resource: ${resource}`);
    }
  }
}
