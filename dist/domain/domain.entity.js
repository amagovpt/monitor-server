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
exports.Domain = void 0;
const typeorm_1 = require("typeorm");
let Domain = (() => {
    let Domain = class Domain {
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn({
            type: 'int'
        }),
        __metadata("design:type", Number)
    ], Domain.prototype, "DomainId", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'int',
            nullable: false
        }),
        __metadata("design:type", Number)
    ], Domain.prototype, "WebsiteId", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'varchar',
            length: 255,
            nullable: false
        }),
        __metadata("design:type", String)
    ], Domain.prototype, "Url", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'datetime',
            nullable: false
        }),
        __metadata("design:type", Object)
    ], Domain.prototype, "Start_Date", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'datetime',
            nullable: true
        }),
        __metadata("design:type", Object)
    ], Domain.prototype, "End_Date", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'tinyint',
            width: 1,
            nullable: false,
            default: 1
        }),
        __metadata("design:type", Number)
    ], Domain.prototype, "Active", void 0);
    Domain = __decorate([
        typeorm_1.Entity('Domain')
    ], Domain);
    return Domain;
})();
exports.Domain = Domain;
//# sourceMappingURL=domain.entity.js.map