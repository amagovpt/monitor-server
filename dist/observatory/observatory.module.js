"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const observatory_controller_1 = require("./observatory.controller");
const page_module_1 = require("../page/page.module");
let ObservatoryModule = class ObservatoryModule {
};
ObservatoryModule = __decorate([
    common_1.Module({
        imports: [page_module_1.PageModule],
        controllers: [observatory_controller_1.ObservatoryController],
        providers: []
    })
], ObservatoryModule);
exports.ObservatoryModule = ObservatoryModule;
//# sourceMappingURL=observatory.module.js.map