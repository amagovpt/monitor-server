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
let CrawlPage = class CrawlPage {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({
        type: 'int'
    }),
    __metadata("design:type", Number)
], CrawlPage.prototype, "CrawlId", void 0);
__decorate([
    typeorm_1.Column({
        type: 'int',
        nullable: false
    }),
    __metadata("design:type", Number)
], CrawlPage.prototype, "CrawlDomainId", void 0);
__decorate([
    typeorm_1.Column({
        type: 'varchar',
        length: 255,
        nullable: false
    }),
    __metadata("design:type", String)
], CrawlPage.prototype, "Uri", void 0);
CrawlPage = __decorate([
    typeorm_1.Entity('CrawlPage')
], CrawlPage);
exports.CrawlPage = CrawlPage;
let CrawlDomain = class CrawlDomain {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({
        type: 'int'
    }),
    __metadata("design:type", Number)
], CrawlDomain.prototype, "CrawlDomainId", void 0);
__decorate([
    typeorm_1.Column({
        type: 'varchar',
        length: 255,
        nullable: false
    }),
    __metadata("design:type", String)
], CrawlDomain.prototype, "DomainUri", void 0);
__decorate([
    typeorm_1.Column({
        type: 'int',
        nullable: false
    }),
    __metadata("design:type", Number)
], CrawlDomain.prototype, "DomainId", void 0);
__decorate([
    typeorm_1.Column({
        type: 'datetime',
        nullable: false
    }),
    __metadata("design:type", Object)
], CrawlDomain.prototype, "Creation_Date", void 0);
__decorate([
    typeorm_1.Column({
        type: 'tinyint',
        width: 1,
        nullable: false
    }),
    __metadata("design:type", Number)
], CrawlDomain.prototype, "Done", void 0);
__decorate([
    typeorm_1.Column({
        type: 'varchar',
        length: 255,
        nullable: false
    }),
    __metadata("design:type", String)
], CrawlDomain.prototype, "SubDomainUri", void 0);
CrawlDomain = __decorate([
    typeorm_1.Entity('CrawlDomain')
], CrawlDomain);
exports.CrawlDomain = CrawlDomain;
//# sourceMappingURL=crawler.entity.js.map