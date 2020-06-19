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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const user_entity_1 = require("../user/user.entity");
const invalid_token_entity_1 = require("./invalid-token.entity");
const security_1 = require("../lib/security");
let AuthService = class AuthService {
    constructor(userRepository, invalidTokenRepository, connection, jwtService) {
        this.userRepository = userRepository;
        this.invalidTokenRepository = invalidTokenRepository;
        this.connection = connection;
        this.jwtService = jwtService;
    }
    async cleanInvalidSessionTokens() {
        const manager = typeorm_2.getManager();
        await manager.query(`DELETE FROM Invalid_Token WHERE Expiration_Date < NOW()`);
    }
    async isTokenBlackListed(token) {
        const invalidToken = await this.invalidTokenRepository.findOne({ where: { Token: token } });
        return !!invalidToken;
    }
    async updateUserLastLogin(userId, date) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let error = false;
        try {
            await queryRunner.manager.update(user_entity_1.User, { UserId: userId }, { Last_Login: date });
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            error = true;
        }
        finally {
            await queryRunner.release();
        }
        return !error;
    }
    async verifyUserCredentials(username, password) {
        const user = await this.userRepository.findOne({ where: { Username: username } });
        if (user && await security_1.comparePasswordHash(password, user.Password)) {
            delete user.Password;
            delete user.Names;
            delete user.Emails;
            delete user.Last_Login;
            delete user.Register_Date;
            return user;
        }
        else {
            return null;
        }
    }
    async verifyUserPayload(payload) {
        const user = await this.userRepository.findOne({ where: { UserId: payload.sub, Username: payload.username, Type: payload.type, Unique_Hash: payload.hash } });
        return !!user;
    }
    login(user) {
        const payload = { username: user.Username, sub: user.UserId, type: user.Type, hash: user.Unique_Hash };
        return this.signToken(payload);
    }
    signToken(payload) {
        return this.jwtService.sign(payload);
    }
    verifyJWT(jwt) {
        try {
            return this.jwtService.verify(jwt);
        }
        catch (err) {
            console.log(err);
            return undefined;
        }
    }
    async logout(token) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const invalidToken = new invalid_token_entity_1.InvalidToken();
        invalidToken.Token = token;
        invalidToken.Expiration_Date = tomorrow;
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let error = false;
        try {
            await queryRunner.manager.save(invalidToken);
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            error = true;
        }
        finally {
            await queryRunner.release();
        }
        return !error;
    }
};
__decorate([
    schedule_1.Cron(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthService.prototype, "cleanInvalidSessionTokens", null);
AuthService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(user_entity_1.User)),
    __param(1, typeorm_1.InjectRepository(invalid_token_entity_1.InvalidToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Connection,
        jwt_1.JwtService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map