import { Injectable } from '@nestjs/common';
import { getManager } from 'typeorm';
import { writeFile } from 'fs-extra';
import badge from 'svg-builder';
import tests from '../evaluation/tests';

@Injectable()
export class StampService {

  async generateAllWebsitesDigitalStamp(): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(`
      SELECT DISTINCT
        w.WebsiteId,
        w.Name,
        d.Url as Domain
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w
        LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
      WHERE
        t.Show_in_Observatorio = 1 AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId
    `);

    const errors = [];

    for (const website of websites || []) {
      const result = await this.generateWebsiteDigitalStamp(website.WebsiteId, website.Domain);
      if (!result) {
        errors.push(website.Name); 
      }
    }

    return errors;
  }

  async generateWebsiteDigitalStamp(websiteId: number, name: string): Promise<boolean> {
    let hasError = false;

    try {
      const manager = getManager();
      const pages = await manager.query(`SELECT
          p.PageId,
          e.Tot,
          e.A,
          e.AA,
          e.AAA,
          e.Score
        FROM
          User as u,
          Website as w,
          Domain as d,
          DomainPage as dp,
          Page as p
          LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
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
              LOWER(u.Type) != 'studies'
            )
          ) AND
          d.WebsiteId = ? AND
          d.Active = 1 AND
          dp.DomainId = d.DomainId AND
          p.PageId = dp.PageId AND
          p.Show_In LIKE "1_1"
        GROUP BY p.PageId, e.Tot, e.A, e.AA, e.AAA, e.Score`, [websiteId, websiteId]);

      const hasLevelError = {
        'A': {
          'passed': 0,
          'warning': 0,
          'failed': 0
        },
        'AA': {
          'passed': 0,
          'warning': 0,
          'failed': 0
        },
        'AAA': {
          'passed': 0,
          'warning': 0,
          'failed': 0
        }
      };

      let score = 0;

      for (const page of pages || []) {
        score += parseFloat(page.Score);

        const tot = JSON.parse(Buffer.from(page.Tot, 'base64').toString());
        for (const res in tot.results || {}) {
          const test = tests[res];
          if (test) {
            const lvl = test['level'].toUpperCase();
            const r = test.result;
            hasLevelError[lvl][r]++;
          }
        }
      }

      const levelToShow = hasLevelError.A.failed === 0 ? hasLevelError.AA.failed === 0 ? 'AAA' : 'AA' : 'A';

      const totalErrors = hasLevelError[levelToShow].failed + hasLevelError[levelToShow].passed;
      const fixedScore = (score / pages.length).toFixed(1);
      
      const path = __dirname + '/../../public/stamps/' + websiteId + '.svg';

      hasError = await this.generateSVG(500, 500, Math.round((hasLevelError[levelToShow].passed / totalErrors) * 100), levelToShow, fixedScore, path);
    } catch (err) {
      console.log(err);
      hasError = true;
    }

    return !hasError;
  }

  private async generateSVG(w: number, h: number, percentage: number, conformance: string, index: string, path: string): Promise<boolean> {
    let hasError = false;
    try {
      const accent = "#4285f4";
      const background = "#ffffff";
      const black = "#000000";
      const grey = "#616161";

      const centerX = w / 2;
      const centerY = h / 2;

      const fontFamily = "verdana";
      const percentageFontSize = 90*h/500;
      const conformanceFontSize = 70*h/500;
      const indexFontSize = 30*h/500;
      const brandFontSize = 30*h/500;

      let progressXRightPie = 0;
      let progressYRightPie = 0;
      let progressXLeftPie = 0;
      let progressYLeftPie = 0;

      badge.width(w).height(h);

      this.addCircle(badge, centerX, centerX, centerY, grey);

      if (percentage < 50) {

        let rads = (percentage * 180 / 50) * (Math.PI / 180);
        progressXRightPie = centerX + Math.sin(rads) * centerX // radius
        progressYRightPie = centerY - Math.cos(rads) * centerY // radius

        this.addPath(badge, "M " + centerX + "," + centerY + " L " + centerX + "," + 0 + " A " + centerX + "," + centerY + " 0 0,1 " + progressXRightPie + "," + progressYRightPie + " Z", accent);
      } else {
        let half = percentage - 50
        let rads = (half * 180 / 50) * (Math.PI / 180);

        progressXRightPie = w / 2
        progressYRightPie = h
        progressXLeftPie = centerX - Math.sin(rads) * centerX // radius
        progressYLeftPie = centerY + Math.cos(rads) * centerY // radius

    
        this.addPath(badge, "M " + centerX + "," + centerY + " L " + centerX + "," + 0 + " A " + centerX + "," + centerY + " 0 0,1 " + progressXRightPie + "," + progressYRightPie + " Z", accent);
        this.addPath(badge, "M " + centerX + "," + centerY + " L " + centerX + "," + h + " A " + centerX + "," + centerY + " 0 0,1 " + progressXLeftPie  + "," + progressYLeftPie  + " Z", accent);

      }

      this.addCircle(badge, centerX * 0.85, centerX, centerY, background);

      this.addText(badge, centerX,          centerY*(1-0.15), fontFamily, 'normal', percentageFontSize,  'bold',   'middle', black, black, percentage + "%")
      this.addText(badge, centerX,          centerY*(1+0.20), fontFamily, 'normal', conformanceFontSize, 'normal', 'middle', grey,  grey,  conformance)
      this.addText(badge, centerX,          centerY*(1+0.45), fontFamily, 'normal', indexFontSize,       'normal', 'middle', black, black, "índice: " + index)
      this.addText(badge, centerX*(1-0.24), centerY*(1+0.64), fontFamily, 'italic', brandFontSize,       'normal', 'middle', black, black, "Access")
      this.addText(badge, centerX*(1+0.24), centerY*(1+0.64), fontFamily, 'normal', brandFontSize,       'bold',   'middle', black, black, "Monitor")

      const render = badge.render();

      await writeFile(path, render);
    } catch(err) {
      console.log(err);
      hasError = true;
    }

    return !hasError;
  }

  private addText(localBadge: any, x: number, y: number, fontFamily: string, fontStyle: string, fontSize: number, fontWeight: string, textAnchor: string, stroke: string, fill: string, text: string): void {
    localBadge.text({
      x,
      y,
      'font-family': fontFamily,
      'font-style': fontStyle,
      'font-size': fontSize,
      'font-weight': fontWeight,
      'text-anchor': textAnchor,
      stroke,
      fill
    }, text)
  }

  private addCircle(localBadge: any, radius: number, cx: number, cy: number, fill: string): void {
    localBadge.circle({
        r: radius,
        fill,
        'stroke-width': 0,
        cx,
        cy
      });
  }

  private addPath(localBadge: any, path: string, fill: string): void {
    localBadge.path({
      fill,
      d: path
    });
  }
}
