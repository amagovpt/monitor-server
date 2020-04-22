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
const websockets_1 = require("@nestjs/websockets");
const evaluation_service_1 = require("../evaluation/evaluation.service");
let PageGateway = class PageGateway {
    constructor(evaluationService) {
        this.evaluationService = evaluationService;
    }
    async evaluateUrl(data, client) {
        const url = decodeURIComponent(data.url);
        const evaluation = await this.evaluationService.evaluateUrl(url);
        client.emit('result', evaluation);
    }
};
__decorate([
    websockets_1.WebSocketServer(),
    __metadata("design:type", Object)
], PageGateway.prototype, "server", void 0);
__decorate([
    websockets_1.SubscribeMessage('evaluation'),
    __param(0, websockets_1.MessageBody()), __param(1, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PageGateway.prototype, "evaluateUrl", null);
PageGateway = __decorate([
    websockets_1.WebSocketGateway(),
    __metadata("design:paramtypes", [evaluation_service_1.EvaluationService])
], PageGateway);
exports.PageGateway = PageGateway;
//# sourceMappingURL=page.gateway.js.map