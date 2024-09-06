import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

type WebsiteInfo = {
  id: number;
  Name: string;
  url: string;
  entidade: string;
  selo: string;
  data_selo: string;
  declaracao: string;
  data_declaracao: string;
  url_observatorio: string;
};

@Injectable()
export class ApiSeloService {
  constructor(
    @InjectDataSource()
    private readonly connection: DataSource
  ) {}

  async getAllStamps(): Promise<any> {
    const sitesWithStamp = await this.connection.query(`
        SELECT DISTINCT
          w.WebsiteId as 'id',
          w.Name as 'Name',
          w.StartingUrl as 'url',
          e.Long_Name as 'entidade',
          w.Stamp as 'selo',
          w.Stamp_Update_Date as 'data_selo',
          w.Declaration as 'declaracao',
          w.Declaration_Update_Date as 'data_declaracao',
          dt.DirectoryID as 'id_diretorio'
        FROM
          Website w,
          EntityWebsite ew,
          Entity e,
          TagWebsite tw,
          DirectoryTag dt
        WHERE
          w.WebsiteId = ew.WebsiteId AND
          ew.EntityId = e.EntityId AND 
          w.WebsiteId = tw.WebsiteId AND
          tw.TagId = dt.TagId AND
          w.Stamp IS NOT NULL
      `);

    const siteList: WebsiteInfo[] = [];

    for (const site of sitesWithStamp) {
      const siteInfo: WebsiteInfo = {
        id: site.id,
        Name: site.Name,
        url: site.url,
        entidade: site.entidade,
        selo: site.selo,
        data_selo: site.data_selo,
        declaracao: site.declaracao,
        data_declaracao: site.data_declaracao,
        url_observatorio: `/directories/${site.id_diretorio}/${site.id}`,
      };
      // convert selo according to the mapping 1 -> "Bronze", 2 -> "Prata", 3 -> "Ouro"
      if (siteInfo.selo == "1") {
        siteInfo.selo = "Bronze";
      } else if (siteInfo.selo == "2") {
        siteInfo.selo = "Prata";
      } else if (siteInfo.selo == "3") {
        siteInfo.selo = "Ouro";
      }
      // convert declaracao according to the mapping 1 -> "Não conforme", 2 -> "Parcialmente conforme", 3 -> "Conforme"
      if (siteInfo.declaracao == "1") {
        siteInfo.declaracao = "Não conforme";
      } else if (siteInfo.declaracao == "2") {
        siteInfo.declaracao = "Parcialmente conforme";
      } else if (siteInfo.declaracao == "3") {
        siteInfo.declaracao = "Conforme";
      }

      siteList.push(siteInfo);
    }

    return JSON.stringify(siteList);
  }
}
