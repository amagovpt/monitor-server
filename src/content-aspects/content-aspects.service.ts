import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { ContentAspects } from "./content-aspects.entity";

@Injectable()
export class ContentAspectsService {
  constructor(
    @InjectDataSource()
    private readonly connection: DataSource,
    @InjectRepository(ContentAspects)
    private readonly contentAspectsRepository: Repository<ContentAspects>
  ) {}

  async createOne(contentAspects: ContentAspects, jsonData: string): Promise<boolean> {
    try {
      const { websiteId, date, conformance, result } = await this.getObjects(jsonData);

      contentAspects.WebsiteId = websiteId;
      contentAspects.Date = date;
      contentAspects.Conformance = conformance;
      contentAspects.Result = result;
    } catch (err) {
      console.log(err);
      return false;
    }

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.save(contentAspects);

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  private async getObjects(data: any): Promise<{ websiteId: number; date: Date; conformance: number; result: string }> {
    const formData = data.formData;

    const uri = formData["site-url"];

    const websiteId = (await this.connection.query(
      `SELECT
        w.WebsiteId
      FROM
        Website as w
      WHERE
        w.StartingUrl = ?`,
      [uri]
    ))[0]?.WebsiteId;

    if (!websiteId) {
      throw new Error("Website does not exist");
    }

    const res = {};
    let conform = 0;
    let applicable = 0;
    
    // group 1, 2 and 5
    for (const g of [1,2,5]) {
      res[`${g}`] = new Array<any>();
      for (const t of [1,2,3,4]) {
        if (formData[`testResult['group_${g}']['test_${g}-${t}']`] !== "NA") {
          applicable++;
          if (formData[`testResult['group_${g}']['test_${g}-${t}']`] === "P") {
            conform++;
          }
        }

        res[`${g}`].push({
          group: g,
          test: t,
          results: formData[`testResult['group_${g}']['test_${g}-${t}']`],
          evidences: formData[`testFacts['group_${g}']['test_${g}-${t}']`],
          notes: formData[`testNotes['group_${g}']['test_${g}-${t}']`]
        });
      }
    }

    // group 3
    res["3"] = new Array<any>();
    for (const t of [1,2,3]) {
      if (formData[`testResult['group_3']['test_3-${t}']`] !== "NA") {
        applicable++;
        if (formData[`testResult['group_3']['test_3-${t}']`] === "P") {
          conform++;
        }
      }

      res["3"].push({
        group: 3,
        test: t,
        results: formData[`testResult['group_3']['test_3-${t}']`],
        evidences: formData[`testFacts['group_3']['test_3-${t}']`],
        notes: formData[`testNotes['group_3']['test_3-${t}']`]
      });
    }

    // group 4
    res["4"] = new Array<any>();
    for (const t of [1,2]) {
      if (formData[`testResult['group_4']['test_4-${t}']`] !== "NA") {
        applicable++;
        if (formData[`testResult['group_4']['test_4-${t}']`] === "P") {
          conform++;
        }
      }

      res["4"].push({
        group: 4,
        test: t,
        results: formData[`testResult['group_4']['test_4-${t}']`],
        evidences: formData[`testFacts['group_4']['test_4-${t}']`],
        notes: formData[`testNotes['group_4']['test_4-${t}']`]
      });
    }

    const conformance = (conform / applicable) * 100;

    const date = formData["site-evaluation-date"] ? new Date(formData["site-evaluation-date"]) : new Date();
    const result = JSON.stringify(res);

    return { websiteId, date, conformance, result };
  }

  async findAll(): Promise<any> {
    return await this.contentAspectsRepository.find();
  }
}

