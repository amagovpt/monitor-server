import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DECLARATION_MAP, STAMP_MAP, StampRow, WebsiteInfo } from './types';
@Injectable()
export class ApiSeloService {
  constructor(
    @InjectDataSource()
    private readonly connection: DataSource,
  ) {}

  async getAllStamps(): Promise<WebsiteInfo[]> {
    const sites = await this.connection.query<StampRow[]>(`
        SELECT DISTINCT
          w.id,
          w.title as "Name",
          w.base_url as "url",
          e.long_name as "entidade",
          ws.stamp as "selo",
          ws.updated_at as "data_selo",
          wd.status as "declaracao",
          wd.updated_at as "data_declaracao",
          dt.directory_id as "id_diretorio"
        FROM
          websites w
        INNER JOIN institutions e ON w.institution_id = e.id
        INNER JOIN website_tags tw ON w.id = tw.website_id
        INNER JOIN directory_tags dt ON tw.tag_id = dt.tag_id
        INNER JOIN website_stamps ws ON ws.website_id = w.id
        INNER JOIN website_declarations wd ON wd.website_id = w.id
        WHERE
          ws.stamp IS NOT NULL
      `);

    return sites.map((site: StampRow): WebsiteInfo => ({
      id: site.id,
      Name: site.Name,
      url: site.url,
      entidade: site.entidade,
      selo: STAMP_MAP[site.selo] || 'Sem selo',
      data_selo: site.data_selo,
      declaracao: DECLARATION_MAP[site.declaracao] || 'Não declarada',
      data_declaracao: site.data_declaracao,
      url_observatorio: `/directories/${site.id_diretorio}/website/${site.id}`,
    }));
  }
}
