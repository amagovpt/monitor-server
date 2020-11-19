"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const lodash_orderby_1 = __importDefault(require("lodash.orderby"));
const tests_1 = __importDefault(require("./tests"));
class Tag {
    constructor(id, name, creationDate) {
        this.id = id;
        this.rank = -1;
        this.name = name;
        this.creationDate = creationDate;
        this.websites = new Array();
        this.nPages = 0;
        this.nPagesWithoutErrors = 0;
        this.entities = new Array();
        this.score = 0;
        this.A = 0;
        this.AA = 0;
        this.AAA = 0;
        this.frequencies = new Array(9).fill(0);
        this.errors = {};
        this.success = {};
    }
    addWebsite(website) {
        this.websites.push(website);
        this.nPages += website.pages.length;
        this.score += website.getScore();
        this.nPagesWithoutErrors += website.AAA;
        if (website.AAA === website.pages.length) {
            this.AAA++;
        }
        else if (website.AAA + website.AA === website.pages.length) {
            this.AA++;
        }
        else if (website.AAA + website.AA + website.A === website.pages.length) {
            this.A++;
        }
        this.frequencies = this.frequencies.map((v, i) => {
            return v + website.frequencies[i];
        });
        const websiteErrors = website.errors;
        for (const error in websiteErrors || {}) {
            if (Object.keys(this.errors).includes(error)) {
                this.errors[error]["n_occurrences"] +=
                    websiteErrors[error]["n_occurrences"];
                this.errors[error]["n_pages"] += websiteErrors[error]["n_pages"];
                this.errors[error]["n_websites"]++;
            }
            else {
                this.errors[error] = {
                    n_occurrences: websiteErrors[error]["n_occurrences"],
                    n_pages: websiteErrors[error]["n_pages"],
                    n_websites: 1,
                };
            }
        }
        const websiteSuccess = website.success;
        for (const practice in websiteSuccess || {}) {
            if (Object.keys(this.success).includes(practice)) {
                this.success[practice]["n_occurrences"] +=
                    websiteSuccess[practice]["n_occurrences"];
                this.success[practice]["n_pages"] +=
                    websiteSuccess[practice]["n_pages"];
                this.success[practice]["n_websites"]++;
            }
            else {
                this.success[practice] = {
                    n_occurrences: websiteSuccess[practice]["n_occurrences"],
                    n_pages: websiteSuccess[practice]["n_pages"],
                    n_websites: 1,
                };
            }
        }
        if (!this.recentPage) {
            this.recentPage = website.recentPage;
        }
        if (!this.oldestPage) {
            this.oldestPage = website.oldestPage;
        }
        if (website.recentPage > this.recentPage) {
            this.recentPage = website.recentPage;
        }
        else if (website.oldestPage < this.oldestPage) {
            this.oldestPage = website.oldestPage;
        }
        if (website.entity && !this.entities.includes(website.entity)) {
            this.entities.push(website.entity);
        }
    }
    getScore() {
        return this.score / this.websites.length;
    }
    getTopTenErrors() {
        const errors = new Array();
        for (const key in this.errors || {}) {
            errors.push({
                key,
                n_occurrences: this.errors[key].n_occurrences,
                n_pages: this.errors[key].n_pages,
                n_websites: this.errors[key].n_websites,
            });
        }
        return lodash_orderby_1.default(errors, ["n_occurrences", "n_pages", "n_websites"], ["desc", "desc", "desc"]).slice(0, 10);
    }
    getPassedOccurrenceByWebsite(test) {
        const occurrences = new Array();
        for (const website of this.websites || []) {
            if (website.success[test] && tests_1.default[test]["result"] === "passed") {
                occurrences.push(website.success[test]["n_occurrences"]);
            }
        }
        return occurrences;
    }
    getErrorOccurrencesByWebsite(test) {
        const occurrences = new Array();
        for (const website of this.websites || []) {
            if (website.errors[test] && tests_1.default[test]["result"] === "failed") {
                occurrences.push(website.errors[test]["n_occurrences"]);
            }
        }
        return occurrences;
    }
}
exports.Tag = Tag;
//# sourceMappingURL=tag.js.map