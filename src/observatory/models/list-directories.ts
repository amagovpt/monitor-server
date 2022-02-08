import orderBy from "lodash.orderby";
import { Directory } from "./directory";
import { Website } from "./website";
import tests from "./tests";

export class ListDirectories {
  directories: Array<Directory>;
  nEntities: number;
  nWebsites: number;
  nPages: number;
  nPagesWithoutErrors: number;
  score: number;
  A: number;
  AA: number;
  AAA: number;
  frequencies: Array<number>;
  errors: any;
  success: any;
  recentPage: Date;
  oldestPage: Date;

  constructor(result: any, directories: Array<Directory>) {
    this.directories = directories;
    this.nPagesWithoutErrors = 0;
    this.A = 0;
    this.AA = 0;
    this.AAA = 0;
    this.frequencies = new Array<number>(9).fill(0);
    this.errors = {};
    this.success = {};

    this.nEntities = result
      .map((r) => r.Entity_Name)
      .filter((v, i, self) => self.indexOf(v) === i).length;

    this.nWebsites = result
      .map((r) => r.Website_Name)
      .filter((v, i, self) => self.indexOf(v) === i).length;

    this.nPages = result
      .map((r) => r.Uri)
      .filter((v, i, self) => {
        return self.indexOf(v) === i;
      }).length;

    let score = 0;

    const tempUniquePageId = new Array<number>();
    const tempErrorUniqueWebsiteId = new Array<number>();
    const tempSuccessUniqueWebsiteId = new Array<number>();
    const tempErrorUniqueTagId = new Array<number>();
    const tempSuccessUniqueTagId = new Array<number>();

    for (const row of result ?? []) {
      if (!tempUniquePageId.includes(row.PageId)) {
        tempUniquePageId.push(row.PageId);

        const score = row.Score;
        const floor = Math.floor(score);
        this.frequencies[floor >= 2 ? (floor === 10 ? floor - 2 : floor - 1) : 0]++;

        const errors = JSON.parse(Buffer.from(row.Errors, "base64").toString());
        const tot = JSON.parse(Buffer.from(row.Tot, "base64").toString());

        const pageErrors = errors;

        for (const key in tot.results || {}) {
          const test = tests[key]["test"];
          const elem = tests[key]["elem"];
          const occurrences =
            pageErrors[test] === undefined || pageErrors[test] < 1
              ? 1
              : pageErrors[test];
          const result = tests[key]["result"];
    
          if (result === "failed") {
            if (!tempErrorUniqueWebsiteId.includes(row.WebsiteId)) {
              tempErrorUniqueWebsiteId.push(row.WebsiteId);

              if (this.errors[key]["n_websites"] === undefined) {
                this.errors[key]["n_websites"] = 0;
              }

              this.errors[key]["n_websites"]++;
            }

            if (!tempErrorUniqueTagId.includes(row.TagId)) {
              tempErrorUniqueTagId.push(row.TagId);

              if (this.errors[key]["n_tags"] === undefined) {
                this.errors[key]["n_tags"] = 0;
              }

              this.errors[key]["n_tags"]++;
            }

            if (Object.keys(this.errors).includes(key)) {
              this.errors[key]["n_occurrences"] += occurrences;
              this.errors[key]["n_pages"]++;
            } else {
              this.errors[key] = {
                n_pages: 1,
                n_occurrences: occurrences,
                elem,
                test,
                result,
              };
            }
          } else if (result === "passed") {
            if (!tempSuccessUniqueWebsiteId.includes(row.WebsiteId)) {
              tempSuccessUniqueWebsiteId.push(row.WebsiteId);

              if (this.success[key]["n_websites"] === undefined) {
                this.success[key]["n_websites"] = 0;
              }

              this.success[key]["n_websites"]++;
            }

            if (!tempSuccessUniqueTagId.includes(row.TagId)) {
              tempSuccessUniqueTagId.push(row.TagId);

              if (this.success[key]["n_tags"] === undefined) {
                this.success[key]["n_tags"] = 0;
              }

              this.success[key]["n_tags"]++;
            }


            if (Object.keys(this.success).includes(key)) {
              this.success[key]["n_occurrences"] += occurrences;
              this.success[key]["n_pages"]++;
            } else {
              this.success[key] = {
                n_pages: 1,
                n_occurrences: occurrences,
                elem,
                test,
                result,
              };
            }
          }
        }
      }
    }

    for (const directory of directories || []) {
      score += directory.getScore();
      this.nPagesWithoutErrors += directory.nPagesWithoutErrors;
      this.A += directory.A;
      this.AA += directory.AA;
      this.AAA += directory.AAA;
      /*this.frequencies = this.frequencies.map((v: number, j: number) => {
        return v + directory.frequencies[j];
      });*/

      //const directoryErrors = directory.errors;

      /*for (const error in directoryErrors || {}) {
        if (Object.keys(this.errors).includes(error)) {
          this.errors[error]["n_occurrences"] +=
            directoryErrors[error]["n_occurrences"];
          this.errors[error]["n_pages"] += directoryErrors[error]["n_pages"];
          this.errors[error]["n_websites"] +=
            directoryErrors[error]["n_websites"];
          this.errors[error]["n_tags"]++;
        } else {
          this.errors[error] = {
            n_occurrences: directoryErrors[error]["n_occurrences"],
            n_pages: directoryErrors[error]["n_pages"],
            n_websites: directoryErrors[error]["n_websites"],
            n_tags: 1,
          };
        }
      }

      const directorySuccess = directory.success;

      for (const practice in directorySuccess || {}) {
        if (Object.keys(this.success).includes(practice)) {
          this.success[practice]["n_occurrences"] +=
            directorySuccess[practice]["n_occurrences"];
          this.success[practice]["n_pages"] +=
            directorySuccess[practice]["n_pages"];
          this.success[practice]["n_websites"] +=
            directorySuccess[practice]["n_websites"];
          this.success[practice]["n_tags"]++;
        } else {
          this.success[practice] = {
            n_occurrences: directorySuccess[practice]["n_occurrences"],
            n_pages: directorySuccess[practice]["n_pages"],
            n_websites: directorySuccess[practice]["n_websites"],
            n_tags: 1,
          };
        }
      }*/

      if (!this.recentPage) {
        this.recentPage = directory.recentPage;
      }

      if (!this.oldestPage) {
        this.oldestPage = directory.oldestPage;
      }

      if (directory.recentPage > this.recentPage) {
        this.recentPage = directory.recentPage;
      } else if (directory.oldestPage < this.oldestPage) {
        this.oldestPage = directory.oldestPage;
      }
    }

    this.score = score / directories.length;
  }

  getScore(): number {
    return this.score;
  }

  getWebsites(): Array<Website> {
    const websites = new Array<Website>();
    const alreadyInList = new Array<number>();
    this.directories.map((dir: Directory) => {
      dir.websites.map((w: Website) => {
        if (!alreadyInList.includes(w.id)) {
          w["DirectoryId"] = dir.id;
          websites.push(w);
        }
      });
    });

    return websites;
  }

  getTopFiveErrors(): any {
    const errors = new Array<any>();
    for (const key in this.errors || {}) {
      errors.push({
        key,
        n_occurrences: this.errors[key].n_occurrences,
        n_pages: this.errors[key].n_pages,
        n_websites: this.errors[key].n_websites,
      });
    }

    return orderBy(
      errors,
      ["n_occurrences", "n_pages", "n_websites"],
      ["desc", "desc", "desc"]
    ).slice(0, 5);
  }

  getTopFiveBestPractices(): any {
    const practices = new Array<any>();
    for (const key in this.success || {}) {
      practices.push({
        key,
        n_occurrences: this.success[key].n_occurrences,
        n_pages: this.success[key].n_pages,
        n_websites: this.success[key].n_websites,
      });
    }

    return orderBy(
      practices,
      ["n_occurrences", "n_pages", "n_websites"],
      ["desc", "desc", "desc"]
    ).slice(0, 5);
  }

  getPassedAndWarningOccurrenceByDirectory(test: string): Array<number> {
    const occurrences = new Array<number>();

    for (const directory of this.directories || []) {
      if (directory.success[test] && tests[test]["result"] !== "failed") {
        occurrences.push(directory.success[test]["n_occurrences"]);
      }
    }
    return occurrences;
  }

  getPassedOccurrenceByDirectory(test: string): Array<number> {
    const occurrences = new Array<number>();

    for (const directory of this.directories || []) {
      if (directory.success[test] && tests[test]["result"] === "passed") {
        occurrences.push(directory.success[test]["n_occurrences"]);
      }
    }
    return occurrences;
  }

  getErrorOccurrenceByDirectory(test: string): Array<number> {
    const occurrences = new Array<number>();

    for (const directory of this.directories || []) {
      if (directory.errors[test] && tests[test]["result"] === "failed") {
        occurrences.push(directory.errors[test]["n_occurrences"]);
      }
    }

    return occurrences;
  }

  getDirectory(id: number): Directory {
    return this.directories.find((directory: Directory) => directory.id === id);
  }

  getWebsite(directoryId: number, websiteId: number): Website {
    const directory = this.directories.find(
      (directory: Directory) => directory.id === directoryId
    );
    const websites = directory.websites;
    const website = websites.find(
      (website: Website) => website.id === websiteId
    );
    return website;
  }
}
