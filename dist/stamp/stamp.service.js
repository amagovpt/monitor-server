"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StampService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const fs_extra_1 = require("fs-extra");
const svg_builder_1 = __importDefault(require("svg-builder"));
let StampService = class StampService {
    async generateAllWebsitesDigitalStamp() {
        const manager = typeorm_1.getManager();
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
    async generateWebsiteDigitalStamp(websiteId, name) {
        let hasError = false;
        try {
            const manager = typeorm_1.getManager();
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
            const passed = {
                A: 0,
                AA: 0,
                AAA: 0
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
            }
            let levelToShow = '';
            let percentage = 0;
            if (passed.A === 0) {
                levelToShow = 'Não conforme';
                percentage = 0;
            }
            else if (passed.A > passed.AA) {
                levelToShow = 'A';
                percentage = Math.round((passed.A / pages.length) * 100);
            }
            else if (passed.AA > passed.AAA) {
                levelToShow = 'AA';
                percentage = Math.round((passed.AA / pages.length) * 100);
            }
            else {
                levelToShow = 'AAA';
                percentage = Math.round((passed.AAA / pages.length) * 100);
            }
            const fixedScore = (score / pages.length).toFixed(1);
            const path = __dirname + '/../../public/stamps/' + websiteId + '.svg';
            hasError = !await this.generateSVG(500, 500, percentage, levelToShow, fixedScore, path);
        }
        catch (err) {
            console.log(err);
            hasError = true;
        }
        return !hasError;
    }
    async generateSVG(w, h, percentage, conformance, index, path) {
        let hasError = false;
        try {
            const accent = "#4285f4";
            const background = "#ffffff";
            const black = "#000000";
            const grey = "#616161";
            const centerX = w / 2;
            const centerY = h / 2;
            const fontFamily = "verdana";
            const percentageFontSize = 90 * h / 500;
            const conformanceFontSize = 70 * h / 500;
            const indexFontSize = 30 * h / 500;
            const brandFontSize = 30 * h / 500;
            let progressXRightPie = 0;
            let progressYRightPie = 0;
            let progressXLeftPie = 0;
            let progressYLeftPie = 0;
            svg_builder_1.default.width(w).height(h);
            this.addCircle(svg_builder_1.default, centerX, centerX, centerY, grey);
            if (percentage < 50) {
                const rads = (percentage * 180 / 50) * (Math.PI / 180);
                progressXRightPie = centerX + Math.sin(rads) * centerX;
                progressYRightPie = centerY - Math.cos(rads) * centerY;
                this.addPath(svg_builder_1.default, "M " + centerX + "," + centerY + " L " + centerX + "," + 0 + " A " + centerX + "," + centerY + " 0 0,1 " + progressXRightPie + "," + progressYRightPie + " Z", accent);
            }
            else {
                const half = percentage - 50;
                const rads = (half * 180 / 50) * (Math.PI / 180);
                progressXRightPie = w / 2;
                progressYRightPie = h;
                progressXLeftPie = centerX - Math.sin(rads) * centerX;
                progressYLeftPie = centerY + Math.cos(rads) * centerY;
                this.addPath(svg_builder_1.default, "M " + centerX + "," + centerY + " L " + centerX + "," + 0 + " A " + centerX + "," + centerY + " 0 0,1 " + progressXRightPie + "," + progressYRightPie + " Z", accent);
                this.addPath(svg_builder_1.default, "M " + centerX + "," + centerY + " L " + centerX + "," + h + " A " + centerX + "," + centerY + " 0 0,1 " + progressXLeftPie + "," + progressYLeftPie + " Z", accent);
            }
            this.addCircle(svg_builder_1.default, centerX * 0.85, centerX, centerY, background);
            this.addText(svg_builder_1.default, centerX, centerY * (1 - 0.15), fontFamily, 'normal', percentageFontSize, 'bold', 'middle', black, black, percentage + "%");
            this.addText(svg_builder_1.default, centerX, centerY * (1 + 0.20), fontFamily, 'normal', conformanceFontSize, 'normal', 'middle', grey, grey, conformance);
            this.addText(svg_builder_1.default, centerX, centerY * (1 + 0.45), fontFamily, 'normal', indexFontSize, 'normal', 'middle', black, black, "índice: " + index);
            this.addText(svg_builder_1.default, centerX * (1 - 0.24), centerY * (1 + 0.64), fontFamily, 'italic', brandFontSize, 'normal', 'middle', black, black, "Access");
            this.addText(svg_builder_1.default, centerX * (1 + 0.24), centerY * (1 + 0.64), fontFamily, 'normal', brandFontSize, 'bold', 'middle', black, black, "Monitor");
            const render = svg_builder_1.default.render();
            await fs_extra_1.writeFile(path, render);
        }
        catch (err) {
            console.log(err);
            hasError = true;
        }
        return !hasError;
    }
    addText(localBadge, x, y, fontFamily, fontStyle, fontSize, fontWeight, textAnchor, stroke, fill, text) {
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
        }, text);
    }
    addCircle(localBadge, radius, cx, cy, fill) {
        localBadge.circle({
            r: radius,
            fill,
            'stroke-width': 0,
            cx,
            cy
        });
    }
    addPath(localBadge, path, fill) {
        localBadge.path({
            fill,
            d: path
        });
    }
};
StampService = __decorate([
    common_1.Injectable()
], StampService);
exports.StampService = StampService;
//# sourceMappingURL=stamp.service.js.map