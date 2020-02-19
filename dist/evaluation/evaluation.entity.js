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
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
let Evaluation = class Evaluation {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({
        type: 'int'
    }),
    __metadata("design:type", Number)
], Evaluation.prototype, "EvaluationId", void 0);
__decorate([
    typeorm_1.Column({
        type: 'int',
        nullable: false
    }),
    __metadata("design:type", Number)
], Evaluation.prototype, "PageId", void 0);
__decorate([
    typeorm_1.Column({
        type: 'varchar',
        length: 255,
        nullable: true
    }),
    __metadata("design:type", String)
], Evaluation.prototype, "Title", void 0);
__decorate([
    typeorm_1.Column({
        type: 'decimal',
        precision: 4,
        scale: 1,
        nullable: false
    }),
    __metadata("design:type", String)
], Evaluation.prototype, "Score", void 0);
__decorate([
    typeorm_1.Column({
        type: 'mediumtext',
        nullable: false
    }),
    __metadata("design:type", String)
], Evaluation.prototype, "Pagecode", void 0);
__decorate([
    typeorm_1.Column({
        type: 'text',
        nullable: false
    }),
    __metadata("design:type", String)
], Evaluation.prototype, "Tot", void 0);
__decorate([
    typeorm_1.Column({
        type: 'mediumtext',
        nullable: false
    }),
    __metadata("design:type", String)
], Evaluation.prototype, "Nodes", void 0);
__decorate([
    typeorm_1.Column({
        type: 'text',
        nullable: false
    }),
    __metadata("design:type", String)
], Evaluation.prototype, "Errors", void 0);
__decorate([
    typeorm_1.Column({
        type: 'int',
        nullable: false
    }),
    __metadata("design:type", Number)
], Evaluation.prototype, "A", void 0);
__decorate([
    typeorm_1.Column({
        type: 'int',
        nullable: false
    }),
    __metadata("design:type", Number)
], Evaluation.prototype, "AA", void 0);
__decorate([
    typeorm_1.Column({
        type: 'int',
        nullable: false
    }),
    __metadata("design:type", Number)
], Evaluation.prototype, "AAA", void 0);
__decorate([
    typeorm_1.Column({
        type: 'datetime',
        nullable: false
    }),
    __metadata("design:type", Object)
], Evaluation.prototype, "Evaluation_Date", void 0);
__decorate([
    typeorm_1.Column({
        type: 'varchar',
        length: 2,
        nullable: false
    }),
    __metadata("design:type", String)
], Evaluation.prototype, "Show_To", void 0);
Evaluation = __decorate([
    typeorm_1.Entity('Evaluation')
], Evaluation);
exports.Evaluation = Evaluation;
//# sourceMappingURL=evaluation.entity.js.map