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
exports.Tag = void 0;
const typeorm_1 = require("typeorm");
const website_entity_1 = require("../website/website.entity");
let Tag = (() => {
    let Tag = class Tag {
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn({
            type: 'int'
        }),
        __metadata("design:type", Number)
    ], Tag.prototype, "TagId", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'int',
            nullable: true
        }),
        __metadata("design:type", Number)
    ], Tag.prototype, "UserId", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'varchar',
            length: 255,
            nullable: false
        }),
        __metadata("design:type", String)
    ], Tag.prototype, "Name", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'tinyint',
            width: 1,
            nullable: false
        }),
        __metadata("design:type", Number)
    ], Tag.prototype, "Show_in_Observatorio", void 0);
    __decorate([
        typeorm_1.Column({
            type: 'datetime',
            nullable: false
        }),
        __metadata("design:type", Object)
    ], Tag.prototype, "Creation_Date", void 0);
    __decorate([
        typeorm_1.ManyToMany(type => website_entity_1.Website),
        typeorm_1.JoinTable(),
        __metadata("design:type", Array)
    ], Tag.prototype, "Websites", void 0);
    Tag = __decorate([
        typeorm_1.Entity('Tag')
    ], Tag);
    return Tag;
})();
exports.Tag = Tag;
//# sourceMappingURL=tag.entity.js.map