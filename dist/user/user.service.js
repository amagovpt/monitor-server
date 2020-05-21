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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const tag_entity_1 = require("../tag/tag.entity");
const website_entity_1 = require("../website/website.entity");
const domain_entity_1 = require("../domain/domain.entity");
const security_1 = require("../lib/security");
let UserService = (() => {
    let UserService = class UserService {
        constructor(userRepository, tagRepository, connection) {
            this.userRepository = userRepository;
            this.tagRepository = tagRepository;
            this.connection = connection;
        }
        async changePassword(userId, password, newPassword) {
            const queryRunner = this.connection.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            let hasError = false;
            try {
                const user = await this.userRepository.findOne({ where: { UserId: userId } });
                if (user && await security_1.comparePasswordHash(password, user.Password)) {
                    const newPasswordHash = await security_1.generatePasswordHash(newPassword);
                    await queryRunner.manager.update(user_entity_1.User, { UserId: userId }, { Password: newPasswordHash });
                }
                else {
                    hasError = true;
                }
                await queryRunner.commitTransaction();
            }
            catch (err) {
                await queryRunner.rollbackTransaction();
                hasError = true;
                console.log(err);
            }
            finally {
                await queryRunner.release();
            }
            if (hasError) {
                throw new common_1.UnauthorizedException();
            }
            return true;
        }
        async update(userId, password, names, emails, app, defaultWebsites, websites, transfer) {
            const queryRunner = this.connection.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            let hasError = false;
            try {
                await queryRunner.manager.update(user_entity_1.User, { UserId: userId }, { Names: names, Emails: emails });
                if (password && password !== 'null') {
                    await queryRunner.manager.update(user_entity_1.User, { UserId: userId }, { Password: await security_1.generatePasswordHash(password) });
                }
                if (app === 'monitor') {
                    for (const id of defaultWebsites || []) {
                        if (!websites.includes(id)) {
                            await queryRunner.manager.query(`
              UPDATE
                Domain as d, 
                DomainPage as dp, 
                Page as p,
                Evaluation as e
              SET 
                p.Show_In = "101",
                e.Show_To = "10" 
              WHERE
                d.WebsiteId = ? AND
                dp.DomainId = d.DomainId AND
                p.PageId = dp.PageId AND
                p.Show_In = "111" AND
                e.PageId = p.PageId`, [id]);
                            await queryRunner.manager.query(`
              UPDATE 
                Domain as d, 
                DomainPage as dp, 
                Page as p,
                Evaluation as e
              SET 
                p.Show_In = "100",
                e.Show_To = "10"
              WHERE
                d.WebsiteId = ? AND
                dp.DomainId = d.DomainId AND
                p.PageId = dp.PageId AND
                p.Show_In = "110" AND
                e.PageId = p.PageId`, [id]);
                            await queryRunner.manager.query(`
              UPDATE 
                Domain as d, 
                DomainPage as dp, 
                Page as p,
                Evaluation as e
              SET 
                p.Show_In = "000",
                e.Show_To = "10" 
              WHERE
                d.WebsiteId = ? AND
                dp.DomainId = d.DomainId AND
                p.PageId = dp.PageId AND
                p.Show_In = "010" AND
                e.PageId = p.PageId`, [id]);
                            await queryRunner.manager.update(website_entity_1.Website, { WebsiteId: id }, { UserId: null });
                        }
                    }
                    for (const id of websites || []) {
                        if (!defaultWebsites.includes(id)) {
                            await queryRunner.manager.update(website_entity_1.Website, { WebsiteId: id }, { UserId: userId });
                            if (transfer) {
                                await queryRunner.manager.query(`UPDATE Domain as d, DomainPage as dp, Page as p, Evaluation as e SET p.Show_In = "111", e.Show_To = "11" 
                WHERE
                  d.WebsiteId = ? AND
                  dp.DomainId = d.DomainId AND
                  p.PageId = dp.PageId AND
                  p.Show_In = "101" AND
                  e.PageId = e.PageId`, [id]);
                            }
                        }
                    }
                }
                await queryRunner.commitTransaction();
            }
            catch (err) {
                await queryRunner.rollbackTransaction();
                hasError = true;
                console.log(err);
            }
            finally {
                await queryRunner.release();
            }
            return !hasError;
        }
        async delete(userId, app) {
            const queryRunner = this.connection.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            let hasError = false;
            try {
                if (app === 'monitor') {
                    await queryRunner.manager.query(`
          UPDATE 
            Website as w,
            Domain as d, 
            DomainPage as dp, 
            Page as p 
          SET 
            p.Show_In = "101" 
          WHERE
            w.UserId = ? AND
            d.WebsiteId = w.WebsiteId AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            p.Show_In LIKE "111"`, [userId]);
                    await queryRunner.manager.query(`
          UPDATE 
            Website as w,
            Domain as d, 
            DomainPage as dp, 
            Page as p 
          SET 
            p.Show_In = "100" 
          WHERE
            w.UserId = ? AND
            d.WebsiteId = w.WebsiteId AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            LOWER(p.Show_In) = "110"`, [userId]);
                    await queryRunner.manager.query(`
          UPDATE 
            Website as w,
            Domain as d, 
            DomainPage as dp, 
            Page as p 
          SET 
            p.Show_In = "000" 
          WHERE
            w.UserId = ? AND
            d.WebsiteId = w.WebsiteId AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            LOWER(p.Show_In) = "100"`, [userId]);
                    await queryRunner.manager.query(`UPDATE Website SET UserId = NULL WHERE UserId = ?`, [userId]);
                }
                else {
                    await queryRunner.manager.query(`DELETE FROM Tag WHERE UserId = ? AND TagId <> 0`, [userId]);
                    await queryRunner.manager.query(`DELETE FROM Website WHERE UserId = ? AND WebsiteId <> 0`, [userId]);
                }
                await queryRunner.manager.query(`DELETE FROM User WHERE UserId = ?`, [userId]);
                await queryRunner.commitTransaction();
            }
            catch (err) {
                await queryRunner.rollbackTransaction();
                hasError = true;
                console.log(err);
            }
            finally {
                await queryRunner.release();
            }
            return !hasError;
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
        async findInfo(userId) {
            const user = await this.userRepository.findOne({ where: { UserId: userId } });
            if (user) {
                if (user.Type === 'monitor') {
                    user['websites'] = await this.userRepository.query(`SELECT * FROM Website WHERE UserId = ?`, [userId]);
                }
                delete user.Password;
                delete user.Unique_Hash;
                return user;
            }
            else {
                throw new common_1.InternalServerErrorException();
            }
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
        async findStudyMonitorUserTagByName(userId, name) {
            return await this.tagRepository.findOne({ where: { Name: name, UserId: userId } });
        }
        async createOne(user, tags, websites, transfer) {
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
                else if (user.Type === 'studies' && tags.length > 0) {
                    const copyTags = await queryRunner.manager.query(`SELECT * FROM Tag WHERE TagId IN (?)`, [tags]);
                    for (const tag of copyTags || []) {
                        const newTag = new tag_entity_1.Tag();
                        newTag.Name = tag.Name;
                        newTag.UserId = insertUser.UserId;
                        newTag.Show_in_Observatorio = 0;
                        newTag.Creation_Date = new Date();
                        const insertTag = await queryRunner.manager.save(newTag);
                        const copyWebsites = await queryRunner.manager.query(`
            SELECT w.*
            FROM
              TagWebsite as tw,
              Website as w
            WHERE
              tw.TagId = ? AND
              w.WebsiteId = tw.WebsiteId  
          `, [tag.TagId]);
                        for (const website of copyWebsites || []) {
                            const newWebsite = new website_entity_1.Website();
                            newWebsite.Name = website.Name;
                            newWebsite.UserId = insertUser.UserId;
                            newWebsite.Creation_Date = new Date();
                            const insertWebsite = await queryRunner.manager.save(newWebsite);
                            await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [insertTag.TagId, insertWebsite.WebsiteId]);
                            const domain = await queryRunner.manager.query(`SELECT * FROM Domain WHERE WebsiteId = ? AND Active = 1`, [website.WebsiteId]);
                            const newDomain = new domain_entity_1.Domain();
                            newDomain.WebsiteId = insertWebsite.WebsiteId;
                            newDomain.Active = 1;
                            newDomain.Start_Date = new Date();
                            newDomain.Url = domain[0].Url;
                            const insertDomain = await queryRunner.manager.save(newDomain);
                            const pages = await queryRunner.manager.query(`SELECT * FROM DomainPage WHERE DomainId = ?`, [domain[0].DomainId]);
                            for (const page of pages || []) {
                                await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [insertDomain.DomainId, page.PageId]);
                            }
                        }
                    }
                }
                await queryRunner.commitTransaction();
            }
            catch (err) {
                await queryRunner.rollbackTransaction();
                hasError = true;
                console.log(err);
            }
            finally {
                await queryRunner.release();
            }
            return !hasError;
        }
        async findType(username) {
            if (username === 'admin') {
                return 'nimda';
            }
            const user = await this.userRepository.findOne({ where: { Username: username } });
            if (user) {
                return user.Type;
            }
            else {
                return null;
            }
        }
        async findAllWebsites(user) {
            const manager = typeorm_2.getManager();
            const websites = await manager.query(`SELECT w.*, d.Url, e.Short_Name as Entity, e.Long_Name as Entity2, u.Username as User 
        FROM 
          Website as w
          LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId,
          User as u,
          Domain as d
        WHERE
          LOWER(u.Username) = ? AND
          w.UserId = u.UserId AND 
          d.WebsiteId = w.WebsiteId AND
          d.Active = "1"
        GROUP BY w.WebsiteId, d.Url`, [user.toLowerCase()]);
            return websites;
        }
        async findAllTags(user) {
            const manager = typeorm_2.getManager();
            const tags = await manager.query(`SELECT t.*, COUNT(distinct tw.WebsiteId) as Websites, u.Username as User 
      FROM 
        User as u,
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      WHERE
        LOWER(u.Username) = ? AND
        t.UserId = u.UserId
      GROUP BY t.TagId`, [user.toLowerCase()]);
            return tags;
        }
    };
    UserService = __decorate([
        common_1.Injectable(),
        __param(0, typeorm_1.InjectRepository(user_entity_1.User)),
        __param(1, typeorm_1.InjectRepository(tag_entity_1.Tag)),
        __metadata("design:paramtypes", [typeorm_2.Repository,
            typeorm_2.Repository,
            typeorm_2.Connection])
    ], UserService);
    return UserService;
})();
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map