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
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const constants_1 = require("./constants");
const auth_service_1 = require("./auth.service");
let JwtMonitorStrategy = class JwtMonitorStrategy extends passport_1.PassportStrategy(passport_jwt_1.Strategy, 'jwt-monitor') {
    constructor(authService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: constants_1.jwtConstants.privateKey,
        });
        this.authService = authService;
    }
    async validate(payload) {
        const valid = await this.authService.verifyUserPayload(payload);
        delete payload.exp;
        const token = this.authService.signToken(payload);
        const isBlackListed = await this.authService.isTokenBlackListed(token);
        if (!valid || payload.type !== 'monitor' || isBlackListed) {
            throw new common_1.UnauthorizedException();
        }
        return { userId: payload.sub, username: payload.username };
    }
};
JwtMonitorStrategy = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], JwtMonitorStrategy);
exports.JwtMonitorStrategy = JwtMonitorStrategy;
//# sourceMappingURL=jwt-monitor.strategy copy.js.map