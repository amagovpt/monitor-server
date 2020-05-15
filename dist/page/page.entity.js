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
exports.Page = void 0;
const typeorm_1 = require("typeorm");
let Page = (() => {
    let Page = class Page {
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn({
            type: 'int'
        }),
        __metadata("design:type", Number)
    ], Page.prototype, "PageId", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'varchar',
            length: 255,
            nullable: false
        }),
        __metadata("design:type", String)
    ], Page.prototype, "Uri", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'varchar',
            length: 3,
            nullable: false,
            default: '000'
        }),
        __metadata("design:type", String)
    ], Page.prototype, "Show_In", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'datetime',
            nullable: false
        }),
        __metadata("design:type", Object)
    ], Page.prototype, "Creation_Date", void 0);
    Page = __decorate([
        typeorm_1.Entity('Page')
    ], Page);
    return Page;
})();
exports.Page = Page;
//# sourceMappingURL=page.entity.js.map