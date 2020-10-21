"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const lodash_clone_1 = __importDefault(require("lodash.clone"));
const evaluation_entity_1 = require("./evaluation.entity");
const middleware_1 = require("./middleware");
let EvaluationService = class EvaluationService {
    constructor(connection) {
        this.connection = connection;
        this.isEvaluatingInstance1 = false;
        this.isEvaluatingInstance2 = false;
        this.isEvaluatingInstance3 = false;
        this.isEvaluatingUserInstance4 = false;
        this.isEvaluatingUserInstance5 = false;
        this.isEvaluatingUserInstance6 = false;
        middleware_1.initEvaluator();
    }
    async instance1EvaluatePageList() {
        if ((process.env.ID === undefined && process.env.ID2 === undefined) || process.env.ID === '0') {
            if (!this.isEvaluatingInstance1) {
                this.isEvaluatingInstance1 = true;
                const pages = await typeorm_1.getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId = -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 1`);
                await this.evaluateInBackground(pages);
                this.isEvaluatingInstance1 = false;
            }
        }
    }
    async instance2EvaluatePageListevaluatePageList() {
        if (process.env.ID === '1') {
            if (!this.isEvaluatingInstance2) {
                this.isEvaluatingInstance2 = true;
                const pages = await typeorm_1.getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId = -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 1`);
                await this.evaluateInBackground(pages);
                this.isEvaluatingInstance2 = false;
            }
        }
    }
    async instance3EvaluatePageListevaluatePageList() {
        if (process.env.ID === '2') {
            if (!this.isEvaluatingInstance3) {
                this.isEvaluatingInstance3 = true;
                const pages = await typeorm_1.getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId = -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 1`);
                await this.evaluateInBackground(pages);
                this.isEvaluatingInstance3 = false;
            }
        }
    }
    async instance4EvaluateUserPageList() {
        if ((process.env.ID === undefined && process.env.ID2 === undefined) || process.env.ID === '3') {
            if (!this.isEvaluatingUserInstance4) {
                this.isEvaluatingUserInstance4 = true;
                const pages = await typeorm_1.getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId <> -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 1`);
                await this.evaluateInBackground(pages);
                this.isEvaluatingUserInstance4 = false;
            }
        }
    }
    async instance5EvaluateUserPageListevaluatePageList() {
        if (process.env.ID === '4') {
            if (!this.isEvaluatingUserInstance5) {
                this.isEvaluatingUserInstance5 = true;
                const pages = await typeorm_1.getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId <> -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 1`);
                await this.evaluateInBackground(pages);
                this.isEvaluatingUserInstance5 = false;
            }
        }
    }
    async instance6EvaluateUserPageListevaluatePageList() {
        if (process.env.ID === '5') {
            if (!this.isEvaluatingUserInstance6) {
                this.isEvaluatingUserInstance6 = true;
                const pages = await typeorm_1.getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId <> -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 1`);
                await this.evaluateInBackground(pages);
                this.isEvaluatingUserInstance6 = false;
            }
        }
    }
    async evaluateInBackground(pages) {
        if (pages.length > 0) {
            try {
                await typeorm_1.getManager().query(`UPDATE Evaluation_List SET Is_Evaluating = 1 WHERE EvaluationListId IN (?)`, [pages.map(p => p.EvaluationListId)]);
            }
            catch (err) {
                console.log(err);
                throw err;
            }
            for (const pte of pages || []) {
                let error = null;
                let evaluation;
                try {
                    evaluation = lodash_clone_1.default(await this.evaluateUrl(pte.Url));
                }
                catch (e) {
                    error = e.stack;
                }
                const queryRunner = this.connection.createQueryRunner();
                await queryRunner.connect();
                await queryRunner.startTransaction();
                try {
                    if (!error && evaluation) {
                        this.savePageEvaluation(queryRunner, pte.PageId, evaluation, pte.Show_To, pte.StudyUserId);
                        await queryRunner.manager.query(`DELETE FROM Evaluation_List WHERE EvaluationListId = ?`, [pte.EvaluationListId]);
                    }
                    else {
                        await queryRunner.manager.query(`UPDATE Evaluation_List SET Error = "?" , Is_Evaluating = 0 WHERE EvaluationListId = ?`, [error.toString(), pte.EvaluationListId]);
                    }
                    await queryRunner.commitTransaction();
                }
                catch (err) {
                    await queryRunner.rollbackTransaction();
                    console.log(err);
                }
                finally {
                    await queryRunner.release();
                }
            }
        }
    }
    evaluateUrl(url) {
        return middleware_1.executeUrlEvaluation(url);
    }
    evaluateHtml(html) {
        return middleware_1.executeHtmlEvaluation(html);
    }
    async createOne(evaluation) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            await queryRunner.manager.save(evaluation);
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async evaluatePageAndSave(pageId, url, showTo) {
        const evaluation = await this.evaluateUrl(url);
        const newEvaluation = new evaluation_entity_1.Evaluation();
        newEvaluation.PageId = pageId;
        newEvaluation.Title = evaluation.data.title.replace(/"/g, '');
        newEvaluation.Score = evaluation.data.score;
        newEvaluation.Pagecode = Buffer.from(evaluation.pagecode).toString('base64');
        newEvaluation.Tot = Buffer.from(JSON.stringify(evaluation.data.tot)).toString('base64');
        newEvaluation.Nodes = Buffer.from(JSON.stringify(evaluation.data.nodes)).toString('base64');
        newEvaluation.Errors = Buffer.from(JSON.stringify(evaluation.data.elems)).toString('base64');
        const conform = evaluation.data.conform.split('@');
        newEvaluation.A = conform[0];
        newEvaluation.AA = conform[1];
        newEvaluation.AAA = conform[2];
        newEvaluation.Evaluation_Date = evaluation.data.date;
        newEvaluation.Show_To = showTo;
        const saveSuccess = await this.createOne(newEvaluation);
        if (saveSuccess) {
            return evaluation;
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
    }
    async savePageEvaluation(queryRunner, pageId, evaluation, showTo, studyUserId = null) {
        const newEvaluation = new evaluation_entity_1.Evaluation();
        newEvaluation.PageId = pageId;
        newEvaluation.Title = evaluation.data.title.replace(/"/g, '');
        newEvaluation.Score = evaluation.data.score;
        newEvaluation.Pagecode = Buffer.from(evaluation.pagecode).toString('base64');
        newEvaluation.Tot = Buffer.from(JSON.stringify(evaluation.data.tot)).toString('base64');
        newEvaluation.Nodes = Buffer.from(JSON.stringify(evaluation.data.nodes)).toString('base64');
        newEvaluation.Errors = Buffer.from(JSON.stringify(evaluation.data.elems)).toString('base64');
        const conform = evaluation.data.conform.split('@');
        newEvaluation.A = conform[0];
        newEvaluation.AA = conform[1];
        newEvaluation.AAA = conform[2];
        newEvaluation.Evaluation_Date = evaluation.data.date;
        newEvaluation.Show_To = showTo;
        newEvaluation.StudyUserId = studyUserId;
        await queryRunner.manager.save(newEvaluation);
    }
    async findMyMonitorUserWebsitePageEvaluations(userId, website) {
        const manager = typeorm_1.getManager();
        const evaluations = await manager.query(`SELECT e.*, p.Uri 
      FROM
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p,
        Evaluation as e
      WHERE
        w.Name = ? AND
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE '_1_' AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND Show_To LIKE '_1')
      `, [website, userId]);
        const reports = new Array();
        for (const evaluation of evaluations || []) {
            const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());
            reports.push({
                pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
                data: {
                    title: evaluation.Title,
                    score: evaluation.Score,
                    rawUrl: evaluation.Uri,
                    tot: tot,
                    nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
                    conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
                    elems: tot.elems,
                    date: evaluation.Evaluation_Date
                }
            });
        }
        return reports;
    }
    async findMyMonitorUserWebsitePageNewestEvaluation(userId, website, url) {
        const manager = typeorm_1.getManager();
        const evaluation = (await manager.query(`SELECT e.* 
      FROM
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p,
        Evaluation as e
      WHERE
        w.Name = ? AND
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Uri = ? AND 
        e.PageId = p.PageId AND 
        e.Show_To LIKE '_1'
      ORDER BY e.Evaluation_Date DESC 
      LIMIT 1`, [website, userId, url]))[0];
        if (evaluation) {
            const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());
            return {
                pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
                data: {
                    title: evaluation.Title,
                    score: evaluation.Score,
                    rawUrl: url,
                    tot: tot,
                    nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
                    conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
                    elems: tot.elems,
                    date: evaluation.Evaluation_Date
                }
            };
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
    }
    async findStudyMonitorUserTagWebsitePageEvaluations(userId, tag, website) {
        const manager = typeorm_1.getManager();
        const evaluations = await manager.query(`SELECT e.*, p.Uri
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p,
        Evaluation as e
      WHERE
        LOWER(t.Name) = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        LOWER(w.Name) = ? AND
        w.UserId = t.UserId AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND StudyUserId = w.UserId)
      `, [tag.toLowerCase(), userId, website.toLowerCase()]);
        const reports = new Array();
        for (const evaluation of evaluations || []) {
            const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());
            reports.push({
                pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
                data: {
                    title: evaluation.Title,
                    score: evaluation.Score,
                    rawUrl: evaluation.Uri,
                    tot: tot,
                    nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
                    conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
                    elems: tot.elems,
                    date: evaluation.Evaluation_Date
                }
            });
        }
        return reports;
    }
    async findStudyMonitorUserTagWebsitePageNewestEvaluation(userId, tag, website, url) {
        const manager = typeorm_1.getManager();
        const evaluation = (await manager.query(`SELECT e.* 
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p,
        Evaluation as e
      WHERE
        LOWER(t.Name) = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        LOWER(w.Name) = ? AND
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        LOWER(p.Uri) = ? AND 
        e.PageId = p.PageId AND
        e.StudyUserId = ?
      ORDER BY e.Evaluation_Date DESC 
      LIMIT 1`, [tag.toLowerCase(), userId, website.toLowerCase(), userId, url.toLowerCase(), userId]))[0];
        if (evaluation) {
            const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());
            return {
                pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
                data: {
                    title: evaluation.Title,
                    score: evaluation.Score,
                    rawUrl: url,
                    tot: tot,
                    nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
                    conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
                    elems: tot.elems,
                    date: evaluation.Evaluation_Date
                }
            };
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
    }
    async findAllEvaluationsFromPage(type, page) {
        const manager = typeorm_1.getManager();
        let query = '';
        if (type === 'admin') {
            query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
        FROM
          User as u,
          Website as w,
          Domain as d,
          DomainPage as dp,
          Page as p,
          Evaluation as e
        WHERE
          LOWER(p.Uri) = ? AND
          p.Show_In LIKE "1%%" AND
          e.PageId = p.PageId AND
          e.Show_To LIKE "1_" AND
          dp.PageId = p.PageId AND
          d.DomainId = dp.DomainId AND
          w.WebsiteId = d.WebsiteId AND
          w.Deleted = "0" AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) = "monitor"))
        ORDER BY e.Evaluation_Date DESC`;
        }
        else if (type === 'monitor') {
            query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
        FROM
          User as u,
          Website as w,
          Domain as d,
          DomainPage as dp,
          Page as p,
          Evaluation as e
        WHERE
          LOWER(p.Uri) = ? AND
          p.Show_In LIKE "11%" AND
          e.PageId = p.PageId AND
          e.Show_To LIKE "_1" AND
          dp.PageId = p.PageId AND
          d.DomainId = dp.DomainId AND
          w.WebsiteId = d.WebsiteId AND
          u.UserId = w.UserId AND 
          LOWER(u.Type) = "monitor"
        ORDER BY e.Evaluation_Date DESC`;
        }
        else if (type === 'studies') {
            query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
        FROM
          Page as p,
          Evaluation as e
        WHERE
          LOWER(p.Uri) = ? AND
          e.PageId = p.PageId
        ORDER BY e.Evaluation_Date DESC
        LIMIT 1`;
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
        const evaluations = await manager.query(query, [page.toLowerCase()]);
        return evaluations;
    }
    async findEvaluationById(url, id) {
        const manager = typeorm_1.getManager();
        const evaluation = await manager.findOne(evaluation_entity_1.Evaluation, { where: { EvaluationId: id } });
        const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());
        return {
            pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
            data: {
                title: evaluation.Title,
                score: evaluation.Score,
                rawUrl: url,
                tot: tot,
                nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
                conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
                elems: tot.elems,
                date: evaluation.Evaluation_Date
            }
        };
    }
    async findUserPageEvaluation(url, type) {
        let query = null;
        if (type === 'monitor') {
            query = `SELECT e.* FROM Page as p, Evaluation as e WHERE p.Uri LIKE ? AND e.PageId = p.PageId AND e.Show_To LIKE "_1" ORDER BY e.Evaluation_Date DESC LIMIT 1`;
        }
        else if (type === 'studies') {
            query = `SELECT e.* FROM Page as p, Evaluation as e WHERE p.Uri LIKE ? AND e.PageId = p.PageId ORDER BY e.Evaluation_Date DESC LIMIT 1`;
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
        const manager = typeorm_1.getManager();
        const evaluation = (await manager.query(query, [url]))[0];
        const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());
        return {
            pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
            data: {
                title: evaluation.Title,
                score: evaluation.Score,
                rawUrl: url,
                tot: tot,
                nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
                conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
                elems: tot.elems,
                date: evaluation.Evaluation_Date
            }
        };
    }
    async tryAgainEvaluation(evaluationListId) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            await queryRunner.manager.query(`UPDATE Evaluation_List SET Error = NULL, Is_Evaluating = 0 WHERE EvaluationListId = ?`, [evaluationListId]);
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async findDomainEvaluations(domain, sample) {
        const manager = typeorm_1.getManager();
        const evaluations = await manager.query(`SELECT distinct e.*, p.Uri
      FROM
        Domain as d,
        DomainPage as dp,
        Page as p,
        Evaluation as e
      WHERE
        d.Url = ? AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE ? AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND Show_To LIKE '1_')
      `, [domain, sample ? '1__' : '1_1']);
        const reports = new Array();
        for (const evaluation of evaluations || []) {
            const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());
            reports.push({
                pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
                data: {
                    title: evaluation.Title,
                    score: evaluation.Score,
                    rawUrl: evaluation.Uri,
                    tot: tot,
                    nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
                    conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
                    elems: tot.elems,
                    date: evaluation.Evaluation_Date
                }
            });
        }
        return reports;
    }
};
__decorate([
    schedule_1.Cron(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationService.prototype, "instance1EvaluatePageList", null);
__decorate([
    schedule_1.Cron('*/2 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationService.prototype, "instance2EvaluatePageListevaluatePageList", null);
__decorate([
    schedule_1.Cron('*/3 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationService.prototype, "instance3EvaluatePageListevaluatePageList", null);
__decorate([
    schedule_1.Cron(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationService.prototype, "instance4EvaluateUserPageList", null);
__decorate([
    schedule_1.Cron('*/2 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationService.prototype, "instance5EvaluateUserPageListevaluatePageList", null);
__decorate([
    schedule_1.Cron('*/3 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationService.prototype, "instance6EvaluateUserPageListevaluatePageList", null);
EvaluationService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [typeorm_1.Connection])
], EvaluationService);
exports.EvaluationService = EvaluationService;
//# sourceMappingURL=evaluation.service.js.map