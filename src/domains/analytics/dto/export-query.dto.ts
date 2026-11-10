import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ExportFormat } from '../queries/type';

export class ExportQueryDto {
  @IsEnum(ExportFormat, { message: 'format must be a valid export format' })
  format: ExportFormat;

  @IsOptional()
  @IsString({ message: 'entityId must be a string' })
  entityId?: string;
}
