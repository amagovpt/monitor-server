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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const websockets_1 = require("@nestjs/websockets");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const SqlString = __importStar(require("sqlstring"));
const auth_service_1 = require("../auth/auth.service");
const evaluation_service_1 = require("../evaluation/evaluation.service");
const page_entity_1 = require("./page.entity");
const evaluation_entity_1 = require("../evaluation/evaluation.entity");
let PageGateway = class PageGateway {
    constructor(authService, evaluationService, pageRepository, connection) {
        this.authService = authService;
        this.evaluationService = evaluationService;
        this.pageRepository = pageRepository;
        this.connection = connection;
    }
    async handleConnection() {
        console.log('Connect');
    }
    async handleDisconnect() {
        console.log('Disconnect');
    }
    async handleMessage(data, client) {
        if (true) {
            let hasError = false;
            const uri = decodeURIComponent(data['uri']);
            const domainId = SqlString.escape(data['domainId']);
            const observatory = SqlString.escape(data['observatory']);
            const queryRunner = this.connection.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                const page = await this.pageRepository.findOne({ select: ['PageId', 'Show_In'], where: { Uri: uri } });
                if (page) {
                    let newShowIn = '100';
                    if (observatory) {
                        if (page.Show_In[1] === '1') {
                            newShowIn = '111';
                        }
                        else {
                            newShowIn = '101';
                        }
                    }
                    else {
                        if (page.Show_In[1] === '1') {
                            newShowIn = '110';
                        }
                    }
                    await queryRunner.manager.update(page_entity_1.Page, { PageId: page.PageId }, { Show_In: newShowIn });
                }
                else {
                    let showIn = null;
                    if (observatory) {
                        showIn = '101';
                    }
                    else {
                        showIn = '100';
                    }
                    const evaluation = await this.evaluationService.evaluateUrl(uri);
                    const newPage = new page_entity_1.Page();
                    newPage.Uri = uri;
                    newPage.Show_In = showIn;
                    newPage.Creation_Date = new Date();
                    const insertPage = await queryRunner.manager.save(newPage);
                    await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [domainId, insertPage.PageId]);
                    const newEvaluation = new evaluation_entity_1.Evaluation();
                    newEvaluation.PageId = insertPage.PageId;
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
                    newEvaluation.Show_To = '10';
                    await queryRunner.manager.save(newEvaluation);
                }
                await queryRunner.commitTransaction();
            }
            catch (err) {
                await queryRunner.rollbackTransaction();
                hasError = true;
                console.log(err);
            }
            finally {
                await queryRunner.release();
            }
            return !hasError;
        }
        else {
            return false;
        }
    }
};
__decorate([
    websockets_1.WebSocketServer(),
    __metadata("design:type", Object)
], PageGateway.prototype, "server", void 0);
__decorate([
    websockets_1.SubscribeMessage('page'),
    __param(0, websockets_1.MessageBody()), __param(1, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PageGateway.prototype, "handleMessage", null);
PageGateway = __decorate([
    websockets_1.WebSocketGateway(),
    __param(2, typeorm_1.InjectRepository(page_entity_1.Page)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        evaluation_service_1.EvaluationService,
        typeorm_2.Repository,
        typeorm_2.Connection])
], PageGateway);
exports.PageGateway = PageGateway;
//# sourceMappingURL=page.gateway.js.map