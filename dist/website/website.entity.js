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
exports.Website = void 0;
const typeorm_1 = require("typeorm");
const tag_entity_1 = require("../tag/tag.entity");
let Website = class Website {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({
        type: "int",
    }),
    __metadata("design:type", Number)
], Website.prototype, "WebsiteId", void 0);
__decorate([
    typeorm_1.Column({
        type: "int",
        nullable: true,
    }),
    __metadata("design:type", Number)
], Website.prototype, "EntityId", void 0);
__decorate([
    typeorm_1.Column({
        type: "int",
        nullable: true,
    }),
    __metadata("design:type", Number)
], Website.prototype, "UserId", void 0);
__decorate([
    typeorm_1.Column({
        type: "varchar",
        length: 255,
        nullable: false,
    }),
    __metadata("design:type", String)
], Website.prototype, "Name", void 0);
__decorate([
    typeorm_1.Column({
        type: "int",
        nullable: true,
    }),
    __metadata("design:type", Number)
], Website.prototype, "Declaration", void 0);
__decorate([
    typeorm_1.Column({
        type: "int",
        nullable: true,
    }),
    __metadata("design:type", Number)
], Website.prototype, "Stamp", void 0);
__decorate([
    typeorm_1.Column({
        type: "datetime",
        nullable: false,
    }),
    __metadata("design:type", Object)
], Website.prototype, "Creation_Date", void 0);
__decorate([
    typeorm_1.Column({
        type: "tinyint",
        width: 1,
        nullable: false,
        default: 0,
    }),
    __metadata("design:type", Number)
], Website.prototype, "Deleted", void 0);
__decorate([
    typeorm_1.ManyToMany((type) => tag_entity_1.Tag),
    typeorm_1.JoinTable(),
    __metadata("design:type", Array)
], Website.prototype, "Tags", void 0);
Website = __decorate([
    typeorm_1.Entity("Website")
], Website);
exports.Website = Website;
//# sourceMappingURL=website.entity.js.map