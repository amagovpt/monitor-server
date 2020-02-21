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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const website_entity_1 = require("../website/website.entity");
let UserService = class UserService {
    constructor(userRepository, connection) {
        this.userRepository = userRepository;
        this.connection = connection;
    }
    async findAllNonAdmin() {
        const manager = typeorm_2.getManager();
        const users = await manager.query(`
      SELECT 
        u.UserId, u.Username, u.Type, u.Register_Date, u.Last_Login, 
        COUNT(distinct w.WebsiteId) as Websites
      FROM User as u
      LEFT OUTER JOIN Website as w ON w.UserId = u.UserId
      WHERE LOWER(u.Type) != "nimda"
      GROUP BY u.UserId`);
        return users;
    }
    async findAllFromMyMonitor() {
        return this.userRepository.find({
            select: ['UserId', 'Username', 'Type', 'Register_Date', 'Last_Login'],
            where: { Type: 'monitor' }
        });
    }
    findById(id) {
        return this.userRepository.findOne(id);
    }
    findByUsername(username) {
        return this.userRepository.findOne({ where: { Username: username } });
    }
    findNumberOfStudyMonitor() {
        return this.userRepository.count({ Type: 'studies' });
    }
    findNumberOfMyMonitor() {
        return this.userRepository.count({ Type: 'monitor' });
    }
    async createOne(user, websites, transfer) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            const insertUser = await queryRunner.manager.save(user);
            if (user.Type === 'monitor' && websites.length > 0) {
                await queryRunner.manager.update(website_entity_1.Website, { WebsiteId: typeorm_2.In(websites) }, { UserId: insertUser.UserId });
                if (transfer) {
                    await queryRunner.manager.query(`UPDATE Domain as d, DomainPage as dp, Page as p, Evaluation as e
            SET 
              p.Show_In = "111",
              e.Show_To = "11" 
            WHERE
              d.WebsiteId IN (?) AND
              dp.DomainId = d.DomainId AND
              p.PageId = dp.PageId AND
              p.Show_In LIKE "101" AND
              e.PageId = p.PageId`, [websites]);
                }
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async remove(id) {
        await this.userRepository.delete(id);
    }
};
UserService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Connection])
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map