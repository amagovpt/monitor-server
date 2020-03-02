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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_entity_1 = require("./evaluation.entity");
const middleware_1 = require("./middleware");
let EvaluationService = class EvaluationService {
    constructor(evaluationRepository, connection) {
        this.evaluationRepository = evaluationRepository;
        this.connection = connection;
    }
    evaluateUrl(url) {
        return middleware_1.executeUrlEvaluation(url);
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
    async findMyMonitorUserWebsitePageNewestEvaluation(userId, website, url) {
        const manager = typeorm_2.getManager();
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
};
EvaluationService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(evaluation_entity_1.Evaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Connection])
], EvaluationService);
exports.EvaluationService = EvaluationService;
//# sourceMappingURL=evaluation.service.js.map