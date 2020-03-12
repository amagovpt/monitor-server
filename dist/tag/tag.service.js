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
const tag_entity_1 = require("./tag.entity");
const website_entity_1 = require("../website/website.entity");
const domain_entity_1 = require("../domain/domain.entity");
let TagService = class TagService {
    constructor(tagRepository, connection) {
        this.tagRepository = tagRepository;
        this.connection = connection;
    }
    findByTagName(tagName) {
        return this.tagRepository.findOne({ where: { Name: tagName } });
    }
    findByOfficialTagName(tagName) {
        return this.tagRepository.findOne({ where: { Name: tagName.toLowerCase(), UserId: typeorm_2.IsNull() } });
    }
    async findInfo(tagId) {
        const tags = await this.tagRepository.query(`SELECT t.*, u.Username FROM Tag as t LEFT OUTER JOIN User as u ON u.UserId = t.UserId WHERE TagId = ? LIMIT 1`, [tagId]);
        if (tags) {
            const tag = tags[0];
            tag.websites = await this.tagRepository.query(`SELECT w.* 
        FROM
          TagWebsite as tw,
          Website as w 
        WHERE
          tw.TagId = ? AND 
          w.WebsiteId = tw.WebsiteId`, [tagId]);
            return tag;
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
    }
    async findAll() {
        const manager = typeorm_2.getManager();
        const tags = await manager.query(`SELECT 
        t.*,
        COUNT(distinct tw.WebsiteId) as Websites 
      FROM 
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      WHERE
        t.UserId IS NULL
      GROUP BY t.TagId`);
        return tags;
    }
    async findAllOfficial() {
        return this.tagRepository.find({ where: { UserId: typeorm_2.IsNull() } });
    }
    async findNumberOfStudyMonitor() {
        const manager = typeorm_2.getManager();
        return (await manager.query(`SELECT COUNT(t.TagId) as Tags FROM Tag as t, User as u WHERE LOWER(u.Type) = "studies" AND t.UserId = u.UserId`))[0].Tags;
    }
    async findNumberOfObservatory() {
        return this.tagRepository.count({ Show_in_Observatorio: 1 });
    }
    async findAllFromStudyMonitorUser(userId) {
        const manager = typeorm_2.getManager();
        const tags = await manager.query(`SELECT 
        distinct t.*, 
        COUNT(distinct tw.WebsiteId) as Websites,
        COUNT(distinct dp.PageId) as Pages 
      FROM 
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
        LEFT OUTER JOIN Domain as d ON d.WebsiteId = tw.WebsiteId
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
      WHERE 
        t.UserId = ?
      GROUP BY t.TagId`, [userId]);
        return tags;
    }
    async findStudyMonitorUserTagData(userId, tag) {
        const manager = typeorm_2.getManager();
        const pages = await manager.query(`SELECT
        w.WebsiteId,
        w.Name,
        d.Url,
        p.Uri,
        e.Score,
        e.Tot,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date
      FROM 
        Page as p,
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Evaluation as e
      WHERE
        LOWER(t.Name) = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`, [tag.toLowerCase(), userId, userId]);
        return pages;
    }
    async findStudyMonitorUserTagWebsitesPagesData(userId, tag, website) {
        const manager = typeorm_2.getManager();
        const pages = await manager.query(`SELECT 
        distinct p.*,
        e.Score,
        e.Tot,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date
      FROM 
        Page as p,
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Evaluation as e
      WHERE
        LOWER(t.Name) = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        LOWER(w.Name) = ? AND
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`, [tag.toLowerCase(), userId, website.toLowerCase(), userId]);
        return pages;
    }
    async getUserId(username) {
        return (await typeorm_2.getManager().query('SELECT * FROM User WHERE Username = ? LIMIT 1', [username]))[0].UserId;
    }
    async findAllUserWebsitePages(tag, website, user) {
        const userId = await this.getUserId(user);
        const manager = typeorm_2.getManager();
        const websiteExists = await manager.query(`SELECT * FROM Website WHERE UserId = ? AND LOWER(Name) = ? LIMIT 1`, [userId, website.toLowerCase()]);
        if (tag !== 'null') {
            if (websiteExists) {
                const pages = await manager.query(`SELECT 
            distinct p.*,
            e.Score,
            e.A,
            e.AA,
            e.AAA,
            e.Evaluation_Date
          FROM 
            Page as p,
            Tag as t,
            TagWebsite as tw,
            Website as w,
            Domain as d,
            DomainPage as dp,
            Evaluation as e
          WHERE
            LOWER(t.Name) = ? AND
            t.UserId = ? AND
            tw.TagId = t.TagId AND
            w.WebsiteId = tw.WebsiteId AND
            LOWER(w.Name) = ? AND
            w.UserId = ? AND
            d.WebsiteId = w.WebsiteId AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            e.PageId = p.PageId AND
            e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId)`, [tag.toLowerCase(), userId, website.toLowerCase(), userId]);
                return pages;
            }
        }
        else {
            if (websiteExists) {
                const pages = await manager.query(`SELECT 
            distinct p.*,
            e.Score,
            e.A,
            e.AA,
            e.AAA,
            e.Errors,
            e.Evaluation_Date
          FROM 
            Page as p,
            Website as w,
            Domain as d,
            DomainPage as dp,
            Evaluation as e
          WHERE
            w.Name = ? AND
            w.UserId = ? AND
            d.WebsiteId = w.WebsiteId AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            e.PageId = p.PageId AND
            p.Show_In LIKE '_1_' AND
            e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId)`, [website, userId]);
                return pages;
            }
        }
    }
    async createOne(tag, websites) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            const insertTag = await queryRunner.manager.save(tag);
            for (const websiteId of websites || []) {
                await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [insertTag.TagId, websiteId]);
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
    async createUserTag(tag, type, tagsId) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            if (type === 'official' || type === 'user') {
                const insertTag = await queryRunner.manager.save(tag);
                if (type === 'official') {
                    let websites = null;
                    if (tagsId.length > 1) {
                        websites = await queryRunner.manager.query(`SELECT w.Name, d.DomainId, d.Url, d.Start_Date
              FROM 
                TagWebsite as tw
                LEFT OUTER JOIN Website as w ON w.WebsiteId = tw.WebsiteId
                LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
              WHERE 
                tw.TagId IN (?)
              GROUP BY
                w.Name, d.DomainId, d.Url, d.Start_Date
              HAVING
                COUNT(tw.WebsiteId) = ?`, [tagsId, tagsId.length]);
                    }
                    else {
                        websites = await queryRunner.manager.query(`SELECT w.Name, d.DomainId, d.Url, d.Start_Date
              FROM 
                TagWebsite as tw
                LEFT OUTER JOIN Website as w ON w.WebsiteId = tw.WebsiteId
                LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
              WHERE 
                tw.TagId = ?
              GROUP BY
                w.Name, d.DomainId, d.Url, d.Start_Date`, [tagsId[0]]);
                    }
                    for (const website of websites || []) {
                        const newWebsite = new website_entity_1.Website();
                        newWebsite.Name = website.Name;
                        newWebsite.UserId = tag.UserId;
                        newWebsite.Creation_Date = tag.Creation_Date;
                        const insertWebsite = await queryRunner.manager.save(newWebsite);
                        const newDomain = new domain_entity_1.Domain();
                        newDomain.WebsiteId = insertWebsite.WebsiteId;
                        newDomain.Url = website.Url;
                        newDomain.Start_Date = website.Start_Date;
                        newDomain.Active = 1;
                        const insertDomain = await queryRunner.manager.save(newDomain);
                        const pages = await queryRunner.manager.query(`SELECT dp.* FROM DomainPage as dp, Page as p WHERE dp.DomainId = ? AND p.PageId = dp.PageId AND p.Show_In LIKE "1_1"`, [website.DomainId]);
                        for (const page of pages || []) {
                            await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [insertDomain.DomainId, page.PageId]);
                        }
                        await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [insertTag.TagId, insertWebsite.WebsiteId]);
                    }
                }
                await queryRunner.commitTransaction();
            }
            else {
                hasError = true;
            }
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
    async update(tagId, name, observatory, defaultWebsites, websites) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            await queryRunner.manager.update(tag_entity_1.Tag, { TagId: tagId }, { Name: name, Show_in_Observatorio: observatory });
            for (const id of defaultWebsites || []) {
                if (!websites.includes(id)) {
                    await queryRunner.manager.query(`DELETE FROM TagWebsite WHERE TagId = ? AND WebsiteId = ?`, [tagId, id]);
                }
            }
            for (const id of websites || []) {
                if (!defaultWebsites.includes(id)) {
                    await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [tagId, id]);
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
    async delete(tagId) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            await queryRunner.manager.delete(tag_entity_1.Tag, { where: { TagId: tagId } });
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
    async removeUserTag(userId, tagsId) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            for (const id of tagsId || []) {
                const relations = await queryRunner.manager.query(`SELECT * FROM TagWebsite WHERE TagId = ? AND WebsiteId <> -1`, [id]);
                if (relations.length > 0) {
                    const websitesId = relations.map(tw => tw.WebsiteId);
                    await queryRunner.manager.delete(website_entity_1.Website, { WebsiteId: typeorm_2.In(websitesId) });
                }
            }
            await queryRunner.manager.delete(tag_entity_1.Tag, { TagId: typeorm_2.In(tagsId) });
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
    async findAllUserTagWebsites(tag, user) {
        const manager = typeorm_2.getManager();
        if (user === 'admin') {
            const websites = await manager.query(`SELECT w.*, e.Short_Name as Entity, e.Long_Name as Entity2, u.Username as User 
        FROM 
          Website as w
          LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId,
          Tag as t,
          TagWebsite as tw
        WHERE
          LOWER(t.Name) = ? AND
          t.UserId IS NULL AND
          tw.TagId = t.TagId AND
          w.WebsiteId = tw.WebsiteId
        GROUP BY w.WebsiteId`, [tag.toLowerCase()]);
            return websites;
        }
        else {
            const websites = await manager.query(`SELECT w.*, d.Url, e.Long_Name as Entity, u.Username as User 
      FROM 
        Website as w
        LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId,
        User as u,
        Tag as t,
        TagWebsite as tw,
        Domain as d
      WHERE
        LOWER(t.Name) = ? AND
        u.Username = ? AND
        t.UserId = u.UserId AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND 
        d.WebsiteId = w.WebsiteId
      GROUP BY w.WebsiteId, d.Url`, [tag.toLowerCase(), user]);
            return websites;
        }
    }
    async verifyUpdateWebsiteAdmin(websiteId) {
        const manager = typeorm_2.getManager();
        const studyP = await manager.query(`SELECT p.PageId
      FROM  
        Page as p, 
        Domain as d,
        DomainPage as dp,
        Website as w
      WHERE 
        w.WebsiteId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        dp.PageId = p.PageId AND
        p.Show_In LIKE '0%'`, [websiteId]);
        return studyP.length === 0;
    }
    async domainExistsInAdmin(websiteId) {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT
        w2.*
      FROM
        Domain as d,
        Domain as d2,
        Website as w,
        Website as w2
      WHERE
        w.WebsiteId = ? AND
        d.WebsiteId = w.WebsiteId AND 
        d2.WebsiteId = w2.WebsiteId AND 
        d2.Url = d.Url AND
        d2.DomainId != d.DomainId`, [websiteId]);
        return websites;
    }
    async import(tagId, tagName) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            const websites = await queryRunner.manager.query(`SELECT tw.*, w.Name FROM TagWebsite as tw, Website as w WHERE tw.TagId = ? AND w.WebsiteId = tw.WebsiteId`, [tagId]);
            if (websites.length > 0) {
                const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                const insertTag = await queryRunner.manager.query(`INSERT INTO Tag (Name, Show_in_Observatorio, Creation_Date) 
                    VALUES (?, "0", ?)`, [tagName, date]);
                for (const website of websites || []) {
                    const websiteId = await this.importWebsite(queryRunner, website.WebsiteId, website.Name);
                    await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [insertTag.insertId, websiteId]);
                }
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            hasError = true;
            console.error(err);
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async importWebsite(queryRunner, websiteId, websiteName) {
        let returnWebsiteId = websiteId;
        const webDomain = await queryRunner.manager.query(`SELECT distinct w.*, d.*
      FROM 
        Page as p, 
        Domain as d, 
        Website as w,
        DomainPage as dp 
      WHERE 
        w.WebsiteId = ? AND
        d.WebsiteId = w.WebsiteId AND 
        d.Active = "1"`, [websiteId]);
        const domDate = webDomain[0].Start_Date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const webDate = webDomain[0].Creation_Date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const pages = await queryRunner.manager.query(`SELECT p.*
      FROM 
        Page as p, 
        Domain as d, 
        Website as w,
        DomainPage as dp 
      WHERE 
        w.WebsiteId = ? AND
        d.WebsiteId = w.WebsiteId AND 
        dp.domainId = d.DomainId AND
        dp.PageId = p.PageId`, [websiteId]);
        const domainP = (await queryRunner.manager.query(`SELECT distinct d.DomainId, w.*
      FROM  
        Domain as d,
        Website as w,
        User as u
      WHERE 
        d.Url = ? AND
        w.WebsiteId = d.WebsiteId AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type = "monitor"))
      LIMIT 1
      `, [webDomain[0].Url]))[0];
        const domainUrl = webDomain[0].Url;
        if (webDomain.length > 0) {
            if (domainP) {
                for (const page of pages || []) {
                    if (page.Show_In[0] === '0') {
                        await this.importPage(queryRunner, page.PageId);
                        try {
                            await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [domainP.DomainId, page.PageId]);
                        }
                        catch (err) {
                        }
                    }
                }
                if (domainP.Deleted === 1) {
                    await queryRunner.manager.query(`UPDATE Website SET Name = ?, Creation_Date = ?, Deleted = "0" WHERE WebsiteId = ?`, [websiteName || domainP.Name, webDate, domainP.WebsiteId]);
                }
                else {
                    await queryRunner.manager.query(`UPDATE Website SET Creation_Date = ? WHERE WebsiteId = ?`, [webDate, domainP.DomainId]);
                }
            }
            else {
                const insertWebsite = await queryRunner.manager.query(`INSERT INTO Website (Name, Creation_Date) VALUES (?, ?)`, [websiteName, webDate]);
                returnWebsiteId = insertWebsite.insertId;
                const domain = await queryRunner.manager.query(`INSERT INTO Domain ( WebsiteId,Url, Start_Date, Active) VALUES (?, ?, ?, "1")`, [insertWebsite.websiteId, domainUrl, domDate]);
                for (const page of pages || []) {
                    if (page.Show_In[0] === '0') {
                        await this.importPage(queryRunner, page.PageId);
                        await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES ("${domain.insertId}", "${page.PageId}")`, [domain.DomainId, page.PageId]);
                    }
                }
            }
        }
        return returnWebsiteId;
    }
    async importPage(queryRunner, pageId) {
        const page = await queryRunner.manager.query(`SELECT Show_In FROM Page WHERE PageId = ? LIMIT 1`, [pageId]);
        if (page.length > 0) {
            const show = "1" + page[0].Show_In[1] + page[0].Show_In[2];
            await queryRunner.manager.query(`UPDATE Page SET Show_In = ? WHERE PageId = ?`, [show, pageId]);
            const evaluation = await queryRunner.manager.query(`SELECT  e.EvaluationId, e.Show_To FROM Evaluation as e WHERE e.PageId = ? AND e.Show_To LIKE "_1" ORDER BY e.Evaluation_Date  DESC LIMIT 1`, [pageId]);
            const evalId = evaluation[0].EvaluationId;
            const showTo = evaluation[0].Show_To;
            if (evaluation.length > 0) {
                const newShowTo = "1" + showTo[1];
                await queryRunner.manager.query(`UPDATE Evaluation SET Show_To = ? WHERE EvaluationId = ?`, [newShowTo, evalId]);
            }
        }
    }
};
TagService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(tag_entity_1.Tag)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Connection])
], TagService);
exports.TagService = TagService;
//# sourceMappingURL=tag.service.js.map