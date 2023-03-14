import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ListDirectories } from "./models/list-directories";
import { Directory } from "./models/directory";
import { Website } from "./models/website";
import clone from "lodash.clonedeep";
import orderBy from "lodash.orderby";
import _tests from "src/evaluation/tests";
import { Observatory } from "./observatory.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { calculateQuartiles } from "src/lib/quartil";

@Injectable()
export class ObservatoryService {
  elemGroups = {
    a: "link",
    all: "other",
    id: "other",
    img: "image",
    longDImg: "graphic",
    area: "area",
    inpImg: "graphic",
    //graphic buttons
    applet: "object",
    hx: "heading",
    label: "form",
    inputLabel: "form",
    form: "form",
    tableData: "table",
    table: "table",
    tableLayout: "table",
    tableComplex: "table",
    frameset: "frame",
    iframe: "frame",
    frame: "frame",
    embed: "object",
    //embedded object
    object: "object",
    fontValues: "other",
    ehandler: "ehandler",
    w3cValidator: "validator",
  };

  constructor(
    @InjectRepository(Observatory)
    private readonly observatoryRepository: Repository<Observatory>
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateData(manual = false): Promise<any> {
    console.log("generating data");
    console.log({ nameSpace: process.env.NAMESPACE, amsid: process.env.AMSID, intParse: parseInt(process.env.AMSID) });
    if (
      (process.env.NAMESPACE === undefined ||
        parseInt(process.env.AMSID) === 0) || manual) {
      const data = await this.getData();

      const directories = new Array<Directory>();
      const tmpDirectories = this.createTemporaryDirectories(data);

      for (const directory of tmpDirectories || []) {
        const newDirectory = this.createDirectory(directory, clone(data));
        directories.push(newDirectory);
      }

      const listDirectories = new ListDirectories(data, directories);

      const { declarations, badges } = this.countDeclarationsAndStamps(
        listDirectories.directories
      );

      const global = {
        score: listDirectories.getScore(),
        nDirectories: listDirectories.directories.length,
        nWebsites: listDirectories.nWebsites,
        nEntities: listDirectories.nEntities,
        nPages: listDirectories.nPages,
        nPagesWithoutErrors: listDirectories.nPagesWithoutErrors,
        recentPage: listDirectories.recentPage,
        oldestPage: listDirectories.oldestPage,
        topFiveWebsites: this.getTopFiveWebsites(listDirectories),
        topFiveBestPractices: listDirectories.getTopFiveBestPractices(),
        topFiveErrors: listDirectories.getTopFiveErrors(),
        declarations,
        badges,
        scoreDistributionFrequency: listDirectories.frequencies,
        errorDistribution: this.getGlobalErrorsDistribution(listDirectories),
        bestPracticesDistribution:
          this.getGlobalBestPracticesDistribution(listDirectories),
        directoriesList: this.getSortedDirectoriesList(listDirectories),
        directories: this.getDirectories(listDirectories),
      };


      if (manual) {
        await this.observatoryRepository.delete({
          Type: "manual",
        });
      }

      await this.observatoryRepository.query(
        "INSERT INTO Observatory (Global_Statistics, Type, Creation_Date) VALUES (?, ?, ?)",
        [JSON.stringify(global), manual ? "manual" : "auto", new Date()]
      );
    }
  }

  async getObservatoryData(): Promise<any> {
    const data = (
      await this.observatoryRepository.query(
        "SELECT * FROM Observatory ORDER BY Creation_Date DESC LIMIT 1"
      )
    )[0].Global_Statistics;

    return JSON.parse(data);
  }

  async getData(): Promise<any> {
    let data = new Array<any>();

    const directories = await this.observatoryRepository.query(
      `SELECT * FROM Directory WHERE Show_in_Observatory = 1`
    );

    for (const directory of directories) {
      const tags = await this.observatoryRepository.query(
        `SELECT t.* FROM DirectoryTag as dt, Tag as t WHERE dt.DirectoryId = ? AND t.TagId = dt.TagId`,
        [directory.DirectoryId]
      );
      const tagsId = tags.map((t) => t.TagId);

      let pages = null;
      if (parseInt(directory.Method) === 0 && tags.length > 1) {
        const websites = await this.observatoryRepository.query(
          `
        SELECT * FROM TagWebsite WHERE TagId IN (?)
      `,
          [tagsId]
        );

        const counts = {};
        for (const w of websites ?? []) {
          if (counts[w.WebsiteId]) {
            counts[w.WebsiteId]++;
          } else {
            counts[w.WebsiteId] = 1;
          }
        }

        const websitesToFetch = new Array<Number>();
        for (const id of Object.keys(counts) ?? []) {
          if (counts[id] === tags.length) {
            websitesToFetch.push(parseInt(id));
          }
        }

        pages = await this.observatoryRepository.query(
          `
          SELECT
            e.EvaluationId,
            e.Title,
            e.Score,
            e.Errors,
            e.Tot,
            e.A,
            e.AA,
            e.AAA,
            e.Evaluation_Date,
            p.PageId,
            p.Uri,
            p.Creation_Date as Page_Creation_Date,
            w.WebsiteId,
            w.Name as Website_Name,
            w.StartingUrl,
            w.Declaration as Website_Declaration,
            w.Declaration_Update_Date as Declaration_Date,
            w.Stamp as Website_Stamp,
            w.Stamp_Update_Date as Stamp_Date,
            w.Creation_Date as Website_Creation_Date
          FROM
            Website as w,
            WebsitePage as wp,
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
              SELECT Evaluation_Date FROM Evaluation 
              WHERE PageId = p.PageId AND Show_To LIKE "1_"
              ORDER BY Evaluation_Date DESC LIMIT 1
            )
          WHERE
            w.WebsiteId IN (?) AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In LIKE "__1"
          GROUP BY
            w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date`,
          [websitesToFetch]
        );
      } else {
        pages = await this.observatoryRepository.query(
          `
          SELECT
            e.EvaluationId,
            e.Title,
            e.Score,
            e.Errors,
            e.Tot,
            e.A,
            e.AA,
            e.AAA,
            e.Evaluation_Date,
            p.PageId,
            p.Uri,
            p.Creation_Date as Page_Creation_Date,
            w.WebsiteId,
            w.Name as Website_Name,
            w.StartingUrl,
            w.Declaration as Website_Declaration,
            w.Declaration_Update_Date as Declaration_Date,
            w.Stamp as Website_Stamp,
            w.Stamp_Update_Date as Stamp_Date,
            w.Creation_Date as Website_Creation_Date
          FROM
            TagWebsite as tw,
            Website as w,
            WebsitePage as wp,
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
              SELECT Evaluation_Date FROM Evaluation 
              WHERE PageId = p.PageId AND Show_To LIKE "1_"
              ORDER BY Evaluation_Date DESC LIMIT 1
            )
          WHERE
            tw.TagId IN (?) AND
            w.WebsiteId = tw.WebsiteId AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In LIKE "__1"
          GROUP BY
            w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date`,
          [tagsId]
        );
      }
      if (pages) {
        pages = pages.filter((p) => p.Score !== null);

        for (const p of pages || []) {
          p.DirectoryId = directory.DirectoryId;
          p.Directory_Name = directory.Name;
          p.Show_in_Observatory = directory.Show_in_Observatory;
          p.Directory_Creation_Date = directory.Creation_Date;
          p.Entity_Name = null;

          const entities = await this.observatoryRepository.query(
            `
            SELECT e.Long_Name
            FROM
              EntityWebsite as ew,
              Entity as e
            WHERE
              ew.WebsiteId = ? AND
              e.EntityId = ew.EntityId
          `,
            [p.WebsiteId]
          );

          if (entities.length > 0) {
            if (entities.length === 1) {
              p.Entity_Name = entities[0].Long_Name;
            } else {
              p.Entity_Name = entities.map((e) => e.Long_Name).join("@,@ ");
            }
          }
        }

        data = [...data, ...pages];
      }
    }

    return data;
  }

  private createTemporaryDirectories(data: any): Array<any> {
    const tmpDirectoriesIds = new Array<number>();
    const tmpDirectories = new Array<any>();
    data.map((directory: any) => {
      if (!tmpDirectoriesIds.includes(directory.DirectoryId)) {
        tmpDirectoriesIds.push(directory.DirectoryId);
        tmpDirectories.push({
          id: directory.DirectoryId,
          name: directory.Directory_Name,
          creation_date: directory.Directory_Creation_Date,
        });
      }
    });

    return tmpDirectories;
  }

  private createDirectory(directory: any, data: any): Directory {
    const newDirectory = new Directory(
      directory.id,
      directory.name,
      directory.creation_date
    );
    const tmpWebsitesIds = new Array<number>();
    const websites = new Array<any>();
    for (const wb of data || []) {
      if (
        wb.DirectoryId === directory.id &&
        !tmpWebsitesIds.includes(wb.WebsiteId)
      ) {
        tmpWebsitesIds.push(wb.WebsiteId);
        websites.push({
          id: wb.WebsiteId,
          entity: wb.Entity_Name,
          name: wb.Website_Name,
          declaration: wb.Website_Declaration,
          declarationDate: wb.Declaration_Date,
          stamp: wb.Website_Stamp,
          stampDate: wb.Stamp_Date,
          startingUrl: wb.StartingUrl,
          creation_date: wb.Website_Creation_Date,
        });
      }
    }

    for (const website of websites || []) {
      const newWebsite = this.createWebsite(website, directory, data);
      newDirectory.addWebsite(newWebsite);
    }

    return newDirectory;
  }

  private createWebsite(website: any, directory: any, data: any): Website {
    const newWebsite = new Website(
      website.id,
      website.entity,
      website.name,
      website.declaration,
      website.declarationDate,
      website.stamp,
      website.stampDate,
      website.startingUrl,
      website.creation_date
    );

    const pages = new Array<any>();
    data.map((p: any) => {
      if (p.Website_Name === website.name && p.DirectoryId === directory.id) {
        pages.push({
          pageId: p.PageId,
          uri: p.Uri,
          creation_date: p.Page_Creation_Date,
          evaluationId: p.EvaluationId,
          title: p.Title,
          score: parseFloat(p.Score),
          errors: p.Errors,
          tot: p.Tot,
          A: p.A,
          AA: p.AA,
          AAA: p.AAA,
          evaluation_date: p.Evaluation_Date,
        });
      }
    });

    for (const page of pages || []) {
      this.addPageToWebsite(newWebsite, page);
    }

    return newWebsite;
  }

  private addPageToWebsite(website: any, page: any): void {
    website.addPage(
      page.pageId,
      page.uri,
      page.creation_date,
      page.evaluationId,
      page.title,
      page.score,
      page.errors,
      page.tot,
      page.A,
      page.AA,
      page.AAA,
      page.evaluation_date
    );
  }

  private countDeclarationsAndStamps(directories: any): any {
    const websitesDeclarationsInList = new Array<number>();
    const websitesStampsInList = new Array<number>();

    const declarations = {
      total: {
        websites: {
          conform: 0,
          partial: 0,
          not_conform: 0,
        },
        apps: {
          conform: 0,
          partial: 0,
          not_conform: 0,
        },
      },
      currentYear: {
        websites: {
          conform: 0,
          partial: 0,
          not_conform: 0,
        },
        apps: {
          conform: 0,
          partial: 0,
          not_conform: 0,
        },
      },
    };
    const badges = {
      total: {
        websites: {
          gold: 0,
          silver: 0,
          bronze: 0,
        },
        apps: {
          gold: 0,
          silver: 0,
          bronze: 0,
        },
      },
      currentYear: {
        websites: {
          gold: 0,
          silver: 0,
          bronze: 0,
        },
        apps: {
          gold: 0,
          silver: 0,
          bronze: 0,
        },
      },
    };

    const currentYear = new Date().getFullYear();

    for (const directory of directories) {
      for (const website of directory.websites) {
        if (
          !websitesDeclarationsInList.includes(website.id) &&
          website.declaration &&
          website.declarationDate
        ) {
          switch (website.declaration) {
            case 1:
              declarations.total.websites.not_conform++;
              break;
            case 2:
              declarations.total.websites.partial++;
              break;
            case 3:
              declarations.total.websites.conform++;
              break;
          }

          if (website.declarationDate.getFullYear() === currentYear) {
            switch (website.declaration) {
              case 1:
                declarations.currentYear.websites.not_conform++;
                break;
              case 2:
                declarations.currentYear.websites.partial++;
                break;
              case 3:
                declarations.currentYear.websites.conform++;
                break;
            }
          }
          websitesDeclarationsInList.push(website.id);
        }
        if (
          !websitesStampsInList.includes(website.id) &&
          website.stamp &&
          website.stampDate
        ) {
          switch (website.stamp) {
            case 1:
              badges.total.websites.bronze++;
              break;
            case 2:
              badges.total.websites.silver++;
              break;
            case 3:
              badges.total.websites.gold++;
              break;
          }

          if (website.stampDate.getFullYear() === currentYear) {
            switch (website.declaration) {
              case 1:
                badges.currentYear.websites.bronze++;
                break;
              case 2:
                badges.currentYear.websites.silver++;
                break;
              case 3:
                badges.currentYear.websites.gold++;
                break;
            }
          }
          websitesStampsInList.push(website.id);
        }
      }
    }

    return { declarations: clone(declarations), badges: clone(badges) };
  }

  getTopFiveWebsites(listDirectories: ListDirectories): any {
    const websites = listDirectories
      .getWebsites()
      .filter((value, index, array) =>  array.indexOf(value) === index && value.A + value.AA + value.AAA > 10 )
      .sort((a: Website, b: Website) => b.getScore() - a.getScore() || b.AAA - a.AAA || b.AA - a.AA || b.A - a.A)
      .slice(0, 5);

    const topFiveWebsites = new Array<any>();

    let i = 1;
    for (const website of websites) {
      topFiveWebsites.push({
        index: i,
        id: website.id,
        DirectoryId: website.DirectoryId,
        entity: website.entity,
        name: website.name,
        score: website.getScore(),
      });
      i++;
    }

    return topFiveWebsites;
  }

  getGlobalErrorsDistribution(listDirectories: ListDirectories): any {
    let graphData = new Array<any>();
    const tableData = new Array<any>();

    for (const k in listDirectories.errors) {
      const v = listDirectories.errors[k];
      if (_tests[k]["result"] === "failed") {
        let key = k;
        let elem = _tests[key]["elem"];
        let n_pages = v["n_pages"];
        let n_websites = v["n_websites"];
        let result = _tests[key]["result"];

        let quartiles = this.calculateQuartilesGlobalErrors(listDirectories, k);

        tableData.push(this.addToTableData(k, v, quartiles));
        graphData.push({ key, elem, n_pages, n_websites, result });
      }
    }

    graphData = graphData.sort(function (a, b) {
      //return a.elem === b.elem ? (b.n_pages === a.n_pages ? b.n_elems - a.n_elems : b.n_pages - a.n_pages) : a.elem.localeCompare(b.elem);
      return b.n_pages === a.n_pages
        ? a.key.localeCompare(b.key)
        : b.n_pages - a.n_pages;
    });

    // because we only want the top 10
    graphData = graphData.slice(0, 10);

    const showTableData = clone(tableData);

    return { errors: listDirectories.errors, graphData, showTableData };
  }

  getGlobalBestPracticesDistribution(listDirectories: ListDirectories): any {
    let graphData = new Array<any>();
    const tableData = new Array<any>();

    for (const k in listDirectories.success) {
      const v = listDirectories.success[k];
      if (_tests[k]["result"] === "passed") {
        let key = k;
        let elem = _tests[key]["elem"];
        let n_pages = v["n_pages"];
        let n_websites = v["n_websites"];
        let result = _tests[key]["result"];

        let quartiles = this.calculateQuartilesGlobalBestPractices(
          listDirectories,
          k
        );
        tableData.push(this.addToTableData(k, v, quartiles));
        graphData.push({ key, elem, n_pages, n_websites, result });
      }
    }

    graphData = graphData.sort(function (a, b) {
      //return a.elem === b.elem ? (b.n_pages === a.n_pages ? b.n_elems - a.n_elems : b.n_pages - a.n_pages) : a.elem.localeCompare(b.elem);
      return b.n_pages === a.n_pages
        ? a.key.localeCompare(b.key)
        : b.n_pages - a.n_pages;
    });

    // because we only want the top 10
    graphData = graphData.slice(0, 10);

    const showTableData = clone(tableData);

    return { success: listDirectories.success, graphData, showTableData };
  }

  private addToTableData(key: string, tot: any, quartiles: any): any {
    return {
      key: key,
      level: _tests[key]["level"].toUpperCase(),
      elem: _tests[key]["elem"],
      websites: tot["n_websites"],
      pages: tot["n_pages"],
      elems: _tests[key]["result"] === "passed" ? -1 : tot["n_occurrences"],
      quartiles: quartiles,
      elemGroup: this.elemGroups[_tests[key]["elem"]],
    };
  }

  getSortedDirectoriesList(listDirectories: ListDirectories): any {
    let rank = 1;
    const directories = listDirectories.directories
      .slice()
      .sort((a: Directory, b: Directory) => b.getScore() - a.getScore() || b.AAA - a.AAA || b.AA - a.AA || b.A - a.A|| b.nPages-a.nPages)
      .map((d: Directory) => {
        d.rank = rank;
        rank++;
        return d;
      });

    const sortedDirectories = new Array<any>();

    for (const directory of directories) {
      sortedDirectories.push({
        id: directory.id,
        rank: directory.rank,
        name: directory.name,
        declarations: directory.declarations,
        stamps: directory.stamps,
        score: directory.getScore(),
        nWebsites: directory.websites.length,
        A: directory.A,
        AA: directory.AA,
        AAA: directory.AAA,
      });
    }

    return sortedDirectories;
  }

  getDirectories(listDirectories: ListDirectories): any {
    const directories = {};

    for (const directory of listDirectories.directories) {
      directories[directory.id] = {
        id: directory.id,
        name: directory.name,
        oldestPage: directory.oldestPage,
        recentPage: directory.recentPage,
        score: directory.getScore(),
        nEntities: directory.entities.length,
        nWebsites: directory.websites.length,
        nPages: directory.nPages,
        scoreDistributionFrequency: directory.frequencies,
        errorDistribution: this.getDirectoryErrorsDistribution(directory),
        bestPracticesDistribution:
          this.getDirectoryBestPracticesDistribution(directory),
        websitesList: this.getSortedDirectoryWebsitesList(directory),
        websites: this.getDirectoryWebsites(directory),
      };
    }

    return directories;
  }

  getDirectoryErrorsDistribution(directory: Directory): any {
    let graphData = new Array<any>();
    const tableData = new Array<any>();

    for (const k in directory.errors) {
      const v = directory.errors[k];
      if (_tests[k]["result"] === "failed") {
        let key = k;
        let elem = _tests[key]["elem"];
        let n_pages = v["n_pages"];
        let n_websites = v["n_websites"];
        let result = _tests[key]["result"];

        let quartiles = this.calculateQuartilesDirectoryErrors(directory, k);

        tableData.push(this.addToTableData(k, v, quartiles));
        graphData.push({ key, elem, n_pages, n_websites, result });
      }
    }

    graphData = graphData.sort(function (a, b) {
      //return a.elem === b.elem ? (b.n_pages === a.n_pages ? b.n_elems - a.n_elems : b.n_pages - a.n_pages) : a.elem.localeCompare(b.elem);
      return b.n_pages === a.n_pages
        ? a.key.localeCompare(b.key)
        : b.n_pages - a.n_pages;
    });

    // because we only want the top 10
    graphData = graphData.slice(0, 10);

    const showTableData = clone(tableData);

    return { errors: directory.errors, graphData, showTableData };
  }

  getDirectoryBestPracticesDistribution(directory: Directory): any {
    let graphData = new Array<any>();
    const tableData = new Array<any>();

    for (const k in directory.success) {
      const v = directory.success[k];
      if (_tests[k]["result"] === "passed") {
        let key = k;
        let elem = _tests[key]["elem"];
        let n_pages = v["n_pages"];
        let n_websites = v["n_websites"];
        let result = _tests[key]["result"];

        let quartiles = this.calculateQuartilesDirectoryBestPractices(
          directory,
          k
        );
        tableData.push(this.addToTableData(k, v, quartiles));
        graphData.push({ key, elem, n_pages, n_websites, result });
      }
    }

    graphData = graphData.sort(function (a, b) {
      //return a.elem === b.elem ? (b.n_pages === a.n_pages ? b.n_elems - a.n_elems : b.n_pages - a.n_pages) : a.elem.localeCompare(b.elem);
      return b.n_pages === a.n_pages
        ? a.key.localeCompare(b.key)
        : b.n_pages - a.n_pages;
    });

    // because we only want the top 10
    graphData = graphData.slice(0, 10);

    const showTableData = clone(tableData);

    return { success: directory.success, graphData, showTableData };
  }

  getSortedDirectoryWebsitesList(directory: Directory): any {
    let rank = 1;
    let websites = directory.websites.slice().map((w: Website) => {
      w.calculatedScore = w.getScore();
      return w;
    });

    websites = orderBy(
      websites,
      ["calculatedScore", "AAA", "AA", "A", "name"],
      ["desc", "desc", "desc", "desc", "asc"]
    ).map((w: Website) => {
      w.rank = rank;
      rank++;
      return w;
    });

    const sortedWebsites = new Array<any>();

    for (const website of websites) {
      sortedWebsites.push({
        id: website.id,
        rank: website.rank,
        name: website.name,
        entity: website.entity,
        declaration: website.declaration,
        stamp: website.stamp,
        score: website.calculatedScore,
        nPages: website.pages.length,
        A: website.A,
        AA: website.AA,
        AAA: website.AAA,
      });
    }

    return sortedWebsites;
  }

  getDirectoryWebsites(directory: Directory): any {
    const websites = {};

    for (const website of directory.websites) {
      let pagesWithErrors = 0;
      let pagesWithoutErrorsA = 0;
      let pagesWithoutErrorsAA = 0;
      let pagesWithoutErrorsAAA = 0;

      const pages = website.pages;
      const size = pages.length;
      for (let i = 0; i < size; i++) {
        if (pages[i].evaluation.A === 0) {
          if (pages[i].evaluation.AA === 0) {
            if (pages[i].evaluation.AAA === 0) {
              pagesWithoutErrorsAAA++;
            } else {
              pagesWithoutErrorsAA++;
            }
          } else {
            pagesWithoutErrorsA++;
          }
        } else {
          pagesWithErrors++;
        }
      }

      const pagesWithoutErrors = size - pagesWithErrors;

      websites[website.id] = {
        id: website.id,
        name: website.name,
        startingUrl: website.startingUrl,
        oldestPage: website.oldestPage,
        recentPage: website.recentPage,
        score: website.getScore(),
        nPages: website.pages.length,
        entity: website.entity,
        pagesWithErrors,
        pagesWithoutErrorsA,
        pagesWithoutErrorsAA,
        pagesWithoutErrorsAAA,
        pagesWithoutErrors,
        accessibilityPlotData: website.getAllScores(),
        scoreDistributionFrequency: website.frequencies,
        errorsDistribution: website.getTopTenErrors(),
        bestPracticesDistribution: website.getTopTenBestPractices(),
        errors: website.errors,
        success: website.success,
        successDetailsTable:
          this.getDirectoryWebsiteSuccessDetailsTable(website),
        errorsDetailsTable: this.getDirectoryWebsiteErrorsDetailsTable(website),
      };
    }

    return websites;
  }

  getDirectoryWebsiteSuccessDetailsTable(website: Website): any {
    const practices = new Array<any>();
    for (const key in website.success || {}) {
      if (website.success[key]) {
        practices.push({
          key,
          n_occurrences: website.success[key].n_occurrences,
          n_pages: website.success[key].n_pages,
          lvl: _tests[key].level.toUpperCase(),
          quartiles: calculateQuartiles(
            website.getPassedOccurrencesByPage(key)
          ),
        });
      }
    }

    const practicesData = orderBy(
      practices,
      ["n_pages", "n_occurrences"],
      ["desc", "desc"]
    );
    const practicesKeys = Object.keys(practicesData);

    return { practicesKeys, practicesData };
  }

  getDirectoryWebsiteErrorsDetailsTable(website: Website): any {
    const practices = new Array<any>();
    for (const key in website.errors || {}) {
      if (website.errors[key]) {
        practices.push({
          key,
          n_occurrences: website.errors[key].n_occurrences,
          n_pages: website.errors[key].n_pages,
          lvl: _tests[key].level.toUpperCase(),
          quartiles: calculateQuartiles(
            website.getErrorOccurrencesByPage(key)
          ),
        });
      }
    }

    const practicesData = orderBy(
      practices,
      ["n_pages", "n_occurrences"],
      ["desc", "desc"]
    );
    const practicesKeys = Object.keys(practicesData);

    return { practicesKeys, practicesData };
  }

  private calculateQuartilesGlobalErrors(
    directories: ListDirectories,
    test: any
  ): Array<any> {
    let data = directories.getErrorOccurrenceByDirectory(test);
    return calculateQuartiles(data);

  }

  private calculateQuartilesGlobalBestPractices(
    directories: ListDirectories,
    test: any
  ): Array<any> {
    let data = directories.getPassedOccurrenceByDirectory(test);
    return calculateQuartiles(data);

  }

  private calculateQuartilesDirectoryErrors(
    directory: Directory,
    test: any
  ): Array<any> {
    let data = directory.getErrorOccurrencesByWebsite(test);
    return calculateQuartiles(data);
  }

  private calculateQuartilesDirectoryBestPractices(
    directory: Directory,
    test: any
  ): Array<any> {
    let data = directory.getPassedOccurrenceByWebsite(test);
    return calculateQuartiles(data);
  }
}
