import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { writeFileSync } from "fs";
import badge from "svg-builder";
import { InjectDataSource } from "@nestjs/typeorm";

@Injectable()
export class StampService {
  constructor(
    @InjectDataSource()
    private readonly connection: DataSource) { }
  async generateAllWebsitesDigitalStamp(): Promise<any> {
    const websites = await this.connection.query(`
      SELECT DISTINCT
        w.WebsiteId,
        w.Name,
        w.StartingUrl
      FROM
        Directory as dir,
        DirectoryTag as dt,
        Tag as t,
        TagWebsite as tw,
        Website as w
      WHERE
        dir.Show_in_Observatory = 1 AND
        dir.DirectoryId = dt.DirectoryId AND
        dt.TagId = tw.TagId AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId
    `);

    let error = null;

    try {
      await this.generateWebsitesDigitalStamp(websites.map((w) => w.WebsiteId));
    } catch (err) {
      error = err;
    }

    return error;
  }

  async generateWebsitesDigitalStamp(websitesId: number[]): Promise<boolean> {
    let hasError = false;

    for (const id of websitesId ?? []) {
      try {
        let pages = await this.connection.query(
          `SELECT
            p.PageId,
            e.Tot,
            e.A,
            e.AA,
            e.AAA,
            e.Score
          FROM
            User as u,
            Website as w,
            WebsitePage as wp,
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
              SELECT Evaluation_Date FROM Evaluation 
              WHERE PageId = p.PageId 
              ORDER BY Evaluation_Date DESC LIMIT 1
            )
          WHERE
            w.WebsiteId = ? AND
            (
              w.UserId IS NULL OR
              (
                u.UserId = w.UserId AND
                u.Type != 'studies'
              )
            ) AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In LIKE "1_1"
          GROUP BY p.PageId, e.Tot, e.A, e.AA, e.AAA, e.Score`,
          [id]
        );

        pages = pages.filter((p) => p.Score !== null);

        const hasLevelError = {
          A: {
            passed: 0,
            warning: 0,
            failed: 0,
          },
          AA: {
            passed: 0,
            warning: 0,
            failed: 0,
          },
          AAA: {
            passed: 0,
            warning: 0,
            failed: 0,
          },
        };

        let score = 0;

        const passed = {
          A: 0,
          AA: 0,
          AAA: 0,
        };

        for (const page of pages || []) {
          score += parseFloat(page.Score);
          if (page.A === 0) {
            passed.A++;
            if (page.AA === 0) {
              passed.AA++;
              if (page.AAA === 0) {
                passed.AAA++;
              }
            }
          }
          /*const tot = JSON.parse(Buffer.from(page.Tot, 'base64').toString());
          for (const res in tot.results || {}) {
            const test = tests[res];
            if (test) {
              const lvl = test['level'].toUpperCase();
              const r = test.result;
              hasLevelError[lvl][r]++;
            }
          }*/
        }

        let levelToShow = "";
        let percentage = 0;

        if (passed.A === 0) {
          levelToShow = "Não conforme";
          percentage = 0;
        } else if (passed.A > passed.AA) {
          levelToShow = "A";
          percentage = Math.round((passed.A / pages.length) * 100);
        } else if (passed.AA > passed.AAA) {
          levelToShow = "AA";
          percentage = Math.round((passed.AA / pages.length) * 100);
        } else {
          levelToShow = "AAA";
          percentage = Math.round((passed.AAA / pages.length) * 100);
        }

        //const levelToShow = hasLevelError.A.failed === 0 ? hasLevelError.AA.failed === 0 ? 'AAA' : 'AA' : 'A';

        //const totalErrors = hasLevelError[levelToShow].failed + hasLevelError[levelToShow].passed;
        const fixedScore = (score / pages.length).toFixed(1);

        const path = __dirname + "/../../public/stamps/" + id + ".svg";

        hasError = !(await this.generateSVG(
          500,
          500,
          percentage,
          levelToShow,
          fixedScore,
          path
        ));
      } catch (err) {
        console.log(err);
        hasError = true;
      }
    }

    return !hasError;
  }

  private async generateSVG(
    w: number,
    h: number,
    percentage: number,
    conformance: string,
    index: string,
    path: string
  ): Promise<boolean> {
    let hasError = false;
    try {
      const accent = "#4285f4";
      const background = "#ffffff";
      const black = "#000000";
      const grey = "#616161";

      const centerX = w / 2;
      const centerY = h / 2;

      const fontFamily = "verdana";
      const percentageFontSize = (90 * h) / 500;
      const conformanceFontSize = (70 * h) / 500;
      const indexFontSize = (30 * h) / 500;
      const brandFontSize = (30 * h) / 500;

      let progressXRightPie = 0;
      let progressYRightPie = 0;
      let progressXLeftPie = 0;
      let progressYLeftPie = 0;

      badge.width(w).height(h);

      this.addCircle(badge, centerX, centerX, centerY, grey);

      if (percentage < 50) {
        const rads = ((percentage * 180) / 50) * (Math.PI / 180);
        progressXRightPie = centerX + Math.sin(rads) * centerX; // radius
        progressYRightPie = centerY - Math.cos(rads) * centerY; // radius

        this.addPath(
          badge,
          "M " +
            centerX +
            "," +
            centerY +
            " L " +
            centerX +
            "," +
            0 +
            " A " +
            centerX +
            "," +
            centerY +
            " 0 0,1 " +
            progressXRightPie +
            "," +
            progressYRightPie +
            " Z",
          accent
        );
      } else {
        const half = percentage - 50;
        const rads = ((half * 180) / 50) * (Math.PI / 180);

        progressXRightPie = w / 2;
        progressYRightPie = h;
        progressXLeftPie = centerX - Math.sin(rads) * centerX; // radius
        progressYLeftPie = centerY + Math.cos(rads) * centerY; // radius

        this.addPath(
          badge,
          "M " +
            centerX +
            "," +
            centerY +
            " L " +
            centerX +
            "," +
            0 +
            " A " +
            centerX +
            "," +
            centerY +
            " 0 0,1 " +
            progressXRightPie +
            "," +
            progressYRightPie +
            " Z",
          accent
        );
        this.addPath(
          badge,
          "M " +
            centerX +
            "," +
            centerY +
            " L " +
            centerX +
            "," +
            h +
            " A " +
            centerX +
            "," +
            centerY +
            " 0 0,1 " +
            progressXLeftPie +
            "," +
            progressYLeftPie +
            " Z",
          accent
        );
      }

      this.addCircle(badge, centerX * 0.85, centerX, centerY, background);

      this.addText(
        badge,
        centerX,
        centerY * (1 - 0.15),
        fontFamily,
        "normal",
        percentageFontSize,
        "bold",
        "middle",
        black,
        black,
        percentage + "%"
      );
      this.addText(
        badge,
        centerX,
        centerY * (1 + 0.2),
        fontFamily,
        "normal",
        conformanceFontSize,
        "normal",
        "middle",
        grey,
        grey,
        conformance
      );
      this.addText(
        badge,
        centerX,
        centerY * (1 + 0.45),
        fontFamily,
        "normal",
        indexFontSize,
        "normal",
        "middle",
        black,
        black,
        "índice: " + index
      );
      this.addText(
        badge,
        centerX * (1 - 0.24),
        centerY * (1 + 0.64),
        fontFamily,
        "italic",
        brandFontSize,
        "normal",
        "middle",
        black,
        black,
        "Access"
      );
      this.addText(
        badge,
        centerX * (1 + 0.24),
        centerY * (1 + 0.64),
        fontFamily,
        "normal",
        brandFontSize,
        "bold",
        "middle",
        black,
        black,
        "Monitor"
      );

      const render = badge.render();

      writeFileSync(path, render);
    } catch (err) {
      console.log(err);
      hasError = true;
    }

    return !hasError;
  }

  private addText(
    localBadge: any,
    x: number,
    y: number,
    fontFamily: string,
    fontStyle: string,
    fontSize: number,
    fontWeight: string,
    textAnchor: string,
    stroke: string,
    fill: string,
    text: string
  ): void {
    localBadge.text(
      {
        x,
        y,
        "font-family": fontFamily,
        "font-style": fontStyle,
        "font-size": fontSize,
        "font-weight": fontWeight,
        "text-anchor": textAnchor,
        stroke,
        fill,
      },
      text
    );
  }

  private addCircle(
    localBadge: any,
    radius: number,
    cx: number,
    cy: number,
    fill: string
  ): void {
    localBadge.circle({
      r: radius,
      fill,
      "stroke-width": 0,
      cx,
      cy,
    });
  }

  private addPath(localBadge: any, path: string, fill: string): void {
    localBadge.path({
      fill,
      d: path,
    });
  }
}
