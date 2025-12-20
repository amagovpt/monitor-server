import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { TransactionAspects } from "./transaction-aspects.entity";

@Injectable()
export class TransactionAspectsService {
  constructor(
    @InjectDataSource()
    private readonly connection: DataSource,
    @InjectRepository(TransactionAspects)
    private readonly transactionAspectsRepository: Repository<TransactionAspects>
  ) {}

  async createOne(transactionAspects: TransactionAspects, jsonData: any) {
    try {
      const { websiteId, date, conformance, result } = await this.getObjects(jsonData);

      transactionAspects.WebsiteId = websiteId;
      transactionAspects.Date = date;
      transactionAspects.Conformance = conformance;
      transactionAspects.Result = result;
    } catch (err) {
      console.log(err);
      return false;
    }

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.save(transactionAspects);

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

    // group 2 and 4
    for (const g of [2,4]) {
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

    // group 1
    res["1"] = new Array<any>();
    for (const t of [1,2,3]) {
      if (formData[`testResult['group_1']['test_1-${t}']`] !== "NA") {
        applicable++;
        if (formData[`testResult['group_1']['test_1-${t}']`] === "P") {
          conform++;
        }
      }

      res["1"].push({
        group: 1,
        test: t,
        results: formData[`testResult['group_1']['test_1-${t}']`],
        evidences: formData[`testFacts['group_1']['test_1-${t}']`],
        notes: formData[`testNotes['group_1']['test_1-${t}']`]
      });
    }

    // group 3
    res["3"] = new Array<any>();
    for (const t of [1,2]) {
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

    const conformance = (conform / applicable) * 100;

    const date = formData["site-evaluation-date"] ? new Date(formData["site-evaluation-date"]) : new Date();
    const result = JSON.stringify(res);

    return { websiteId, date, conformance, result };
  }

  async findAll(): Promise<any> {
    return await this.transactionAspectsRepository.find();
  }
}
