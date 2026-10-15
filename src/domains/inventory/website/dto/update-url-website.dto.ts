import { IsNotEmpty, IsUrl } from 'class-validator';
import { Website } from '../website.entity';
import { PickType } from '@nestjs/mapped-types';

export class UpdateUrlWebsiteDto extends PickType(Website, ['baseUrl'] as const) {
  @IsNotEmpty()
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      message: 'baseUrl must be a valid URL',
    },
  )
  baseUrl: string;
}
