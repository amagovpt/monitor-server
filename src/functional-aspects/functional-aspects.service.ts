import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { FunctionalAspects } from "./functional-aspects.entity";

@Injectable()
export class FunctionalAspectsService {
  constructor(
    @InjectDataSource()
    private readonly connection: DataSource,
    @InjectRepository(FunctionalAspects)
    private readonly functionalAspectsRepository: Repository<FunctionalAspects>
  ) {}

  async createOne(functionalAspects: FunctionalAspects, jsonData: any) {
    try {
      const { websiteId, date, conformance, result } = await this.getObjects(jsonData);

      functionalAspects.WebsiteId = websiteId;
      functionalAspects.Date = date;
      functionalAspects.Conformance = conformance;
      functionalAspects.Result = result;
    } catch (err) {
      console.log(err);
      return false;
    }

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.save(functionalAspects);

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

    // group 1, 4 and 5
    for (const g of [1,4,5]) {
      res[`${g}`] = new Array<any>();
      for (const t of [1,2,3]) {
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

    // group 2, 3, 6 and 7
    for (const g of [2,3,6,7]) {
      res[`${g}`] = new Array<any>();
      for (const t of [1,2]) {
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

    // group 8
    res["8"] = new Array<any>();
    for (const t of [1,2,3,4,5]) {
      if (formData[`testResult['group_8']['test_8-${t}']`] !== "NA") {
        applicable++;
        if (formData[`testResult['group_8']['test_8-${t}']`] === "P") {
          conform++;
        }
      }

      res["8"].push({
        group: 8,
        test: t,
        results: formData[`testResult['group_8']['test_8-${t}']`],
        evidences: formData[`testFacts['group_8']['test_8-${t}']`],
        notes: formData[`testNotes['group_8']['test_8-${t}']`]
      });
    }

    // group 9
    res["9"] = new Array<any>();
    for (const t of [1,2,3,4]) {
      if (formData[`testResult['group_9']['test_9-${t}']`] !== "NA") {
        applicable++;
        if (formData[`testResult['group_9']['test_9-${t}']`] === "P") {
          conform++;
        }
      }

      res["9"].push({
        group: 9,
        test: t,
        results: formData[`testResult['group_9']['test_9-${t}']`],
        evidences: formData[`testFacts['group_9']['test_9-${t}']`],
        notes: formData[`testNotes['group_9']['test_9-${t}']`]
      });
    }

    // group 10
    if (formData["testResult['group_10']['test_10-1']"] !== "NA") {
      applicable++;
      if (formData["testResult['group_10']['test_10-1']"] === "P") {
        conform++;
      }
    }

    res["10"] = [{
      group: 10,
      test: 1,
      results: formData["testResult['group_10']['test_10-1']"],
      evidences: formData["testFacts['group_10']['test_10-1']"],
      notes: formData["testNotes['group_10']['test_10-1']"]
    }];

    const conformance = (conform / applicable) * 100;

    const date = formData["site-evaluation-date"] ? new Date(formData["site-evaluation-date"]) : new Date();
    const result = JSON.stringify(res);

    return { websiteId, date, conformance, result };
  }

  async findAll(): Promise<any> {
    return await this.functionalAspectsRepository.find();
  }
}
