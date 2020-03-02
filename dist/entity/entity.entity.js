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
let EntityTable = class EntityTable {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({
        type: 'int'
    }),
    __metadata("design:type", Number)
], EntityTable.prototype, "EntityId", void 0);
__decorate([
    typeorm_1.Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        unique: true
    }),
    __metadata("design:type", String)
], EntityTable.prototype, "Short_Name", void 0);
__decorate([
    typeorm_1.Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        unique: true
    }),
    __metadata("design:type", String)
], EntityTable.prototype, "Long_Name", void 0);
__decorate([
    typeorm_1.Column({
        type: 'datetime',
        nullable: false
    }),
    __metadata("design:type", Object)
], EntityTable.prototype, "Creation_Date", void 0);
EntityTable = __decorate([
    typeorm_1.Entity('Entity')
], EntityTable);
exports.EntityTable = EntityTable;
//# sourceMappingURL=entity.entity.js.map