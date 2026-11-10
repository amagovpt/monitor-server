import { IsDefined, IsEnum, IsInt, IsNotEmpty, IsString, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ExportFormat, ExportContext, ExportResource } from '../queries/type';

const RESOURCES_REQUIRING_ENTITY = new Set<ExportResource>([
  ExportResource.WEBSITE,
  ExportResource.TAG,
  ExportResource.INSTITUTION,
  ExportResource.DIRECTORY,
  ExportResource.LATEST_PAGES_EVALUATION,
  ExportResource.ALL_PAGES_EVALUATIONS,
]);

export class ExportAnalyticsDto {
  @IsEnum(ExportResource)
  resource: ExportResource;

  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsEnum(ExportContext)
  context: ExportContext;

  @ValidateIf(
    (o: ExportAnalyticsDto) =>
      RESOURCES_REQUIRING_ENTITY.has(o.resource) || o.entityId !== undefined,
  )
  @IsDefined({ message: 'entityId is required for the selected resource' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  entityId?: number;
}
