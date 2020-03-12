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
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const user_service_1 = require("./user.service");
const user_entity_1 = require("./user.entity");
const security_1 = require("../lib/security");
const response_1 = require("../lib/response");
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async changeUserPassword(req) {
        const password = req.body.password;
        const newPassword = req.body.newPassword;
        const confirmNewPassword = req.body.confirmPassword;
        if (newPassword !== confirmNewPassword) {
            throw new common_1.UnauthorizedException();
        }
        return response_1.success(!!await this.userService.changePassword(req.user.userId, password, newPassword));
    }
    async createUser(req) {
        const user = new user_entity_1.User();
        user.Username = req.body.username;
        user.Password = await security_1.generatePasswordHash(req.body.password);
        user.Names = req.body.names;
        user.Emails = req.body.emails;
        user.Type = req.body.type;
        user.Register_Date = new Date();
        user.Unique_Hash = security_1.createRandomUniqueHash();
        const websites = JSON.parse(req.body.websites);
        const transfer = !!req.body.transfer;
        const createSuccess = await this.userService.createOne(user, websites, transfer);
        if (!createSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    async updateUser(req) {
        const userId = req.body.userId;
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;
        if (password !== confirmPassword) {
            return response_1.success(false);
        }
        const names = req.body.names;
        const emails = req.body.emails;
        const app = req.body.app;
        const websites = JSON.parse(req.body.websites);
        const defaultWebsites = JSON.parse(req.body.defaultWebsites);
        const transfer = !!req.body.transfer;
        const updateSuccess = await this.userService.update(userId, password, names, emails, app, defaultWebsites, websites, transfer);
        if (!updateSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    async deleteUser(req) {
        const userId = req.body.userId;
        const app = req.body.app;
        const deleteSuccess = await this.userService.delete(userId, app);
        if (!deleteSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    getUser(id) {
        return this.userService.findById(id);
    }
    async getUserInfo(userId) {
        return response_1.success(await this.userService.findInfo(userId));
    }
    async checkIfUsernameExists(username) {
        return response_1.success(!!await this.userService.findByUsername(username.toLowerCase()));
    }
    async getAllNonAdminUsers() {
        return response_1.success(await this.userService.findAllNonAdmin());
    }
    async getAllMyMonitorUsers() {
        return response_1.success(await this.userService.findAllFromMyMonitor());
    }
    async getNumberOfStudyMonitorUsers() {
        return response_1.success(await this.userService.findNumberOfStudyMonitor());
    }
    async getNumberOfMyMonitorUsers() {
        return response_1.success(await this.userService.findNumberOfMyMonitor());
    }
    async checkIfUserTagNameExists(req, name) {
        if (name) {
            return response_1.success(!!await this.userService.findStudyMonitorUserTagByName(req.user.userId, name));
        }
        else {
            return response_1.success(false);
        }
    }
    async getUserType(user) {
        if (user) {
            return response_1.success(await this.userService.findType(user));
        }
        else {
            return response_1.success(null);
        }
    }
    async getListOfUserWebsites(user) {
        if (user) {
            return response_1.success(await this.userService.findAllWebsites(user));
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
    }
    async getListOfUserTags(user) {
        if (user) {
            return response_1.success(await this.userService.findAllTags(user));
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
    }
};
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt')),
    common_1.Post('changePassword'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "changeUserPassword", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('create'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createUser", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('update'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUser", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('delete'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteUser", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('get/:id'),
    __param(0, common_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUser", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('info/:userId'),
    __param(0, common_1.Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserInfo", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('exists/:username'),
    __param(0, common_1.Param('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "checkIfUsernameExists", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getAllNonAdminUsers", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('myMonitor'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getAllMyMonitorUsers", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('studyMonitor/total'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getNumberOfStudyMonitorUsers", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('myMonitor/total'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getNumberOfMyMonitorUsers", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Get('tag/nameExists/:name'),
    __param(0, common_1.Request()), __param(1, common_1.Param('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "checkIfUserTagNameExists", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('type/:user'),
    __param(0, common_1.Param('user')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserType", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('websites/:user'),
    __param(0, common_1.Param('user')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getListOfUserWebsites", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('tags/:user'),
    __param(0, common_1.Param('user')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getListOfUserTags", null);
UserController = __decorate([
    common_1.Controller('user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map