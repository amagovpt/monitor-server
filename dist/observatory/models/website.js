"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Website = void 0;
const page_1 = require("./page");
const tests_1 = __importDefault(require("./tests"));
const lodash_orderby_1 = __importDefault(require("lodash.orderby"));
class Website {
    constructor(id, entity, name, domain, creationDate) {
        this.id = id;
        this.rank = -1;
        this.entity = entity;
        this.name = name;
        this.domain = domain;
        this.creationDate = creationDate;
        this.pages = new Array();
        this.score = 0;
        this.A = 0;
        this.AA = 0;
        this.AAA = 0;
        this.frequencies = new Array(9).fill(0);
        this.errors = {};
        this.success = {};
    }
    addPage(pageId, uri, creationDate, evaluationId, title, score, errors, tot, A, AA, AAA, evaluationDate) {
        const page = new page_1.Page(pageId, uri, creationDate);
        page.addEvaluation(evaluationId, title, score, errors, tot, A, AA, AAA, evaluationDate);
        this.pages.push(page);
        this.score += score;
        if (A === 0) {
            if (AA === 0) {
                if (AAA === 0) {
                    this.AAA++;
                }
                else {
                    this.AA++;
                }
            }
            else {
                this.A++;
            }
        }
        const floor = Math.floor(score);
        this.frequencies[floor >= 2 ? (floor === 10 ? floor - 2 : floor - 1) : 0]++;
        const pageErrors = page.evaluation.errors;
        for (const key in page.evaluation.tot.results || {}) {
            const test = tests_1.default[key]["test"];
            const elem = tests_1.default[key]["elem"];
            const occurrences = pageErrors[test] === undefined ||
                pageErrors[test] < 1 ||
                pageErrors[test] === "lang"
                ? 1
                : pageErrors[test];
            const result = tests_1.default[key]["result"];
            if (result === "failed") {
                if (Object.keys(this.errors).includes(key)) {
                    this.errors[key]["n_occurrences"] += occurrences;
                    this.errors[key]["n_pages"]++;
                }
                else {
                    this.errors[key] = {
                        n_pages: 1,
                        n_occurrences: occurrences,
                        elem,
                        test,
                        result,
                    };
                }
            }
            else if (result === "passed") {
                if (Object.keys(this.success).includes(key)) {
                    this.success[key]["n_occurrences"] += occurrences;
                    this.success[key]["n_pages"]++;
                }
                else {
                    this.success[key] = {
                        n_pages: 1,
                        n_occurrences: occurrences,
                        elem,
                        test,
                        result,
                    };
                }
            }
        }
        if (!this.recentPage) {
            this.recentPage = evaluationDate;
        }
        if (!this.oldestPage) {
            this.oldestPage = evaluationDate;
        }
        if (evaluationDate > this.recentPage) {
            this.recentPage = evaluationDate;
        }
        else if (evaluationDate < this.oldestPage) {
            this.oldestPage = evaluationDate;
        }
    }
    getScore() {
        return this.score / this.pages.length;
    }
    getAllScores() {
        return this.pages.map((page) => page.evaluation.score);
    }
    getTopTenBestPractices() {
        const practices = new Array();
        for (const key in this.success || {}) {
            practices.push({
                key,
                n_occurrences: this.success[key].n_occurrences,
                n_pages: this.success[key].n_pages,
            });
        }
        return lodash_orderby_1.default(practices, ["n_occurrences", "n_pages"], ["desc", "desc"]).slice(0, 10);
    }
    getTopTenErrors() {
        const errors = new Array();
        for (const key in this.errors || {}) {
            errors.push({
                key,
                n_occurrences: this.errors[key].n_occurrences,
                n_pages: this.errors[key].n_pages,
            });
        }
        return lodash_orderby_1.default(errors, ["n_occurrences", "n_pages"], ["desc", "desc"]).slice(0, 10);
    }
    getPassedOccurrencesByPage(test) {
        const occurrences = new Array();
        for (const page of this.pages || []) {
            const practice = page.evaluation.tot.elems[tests_1.default[test]["test"]];
            if (page.evaluation.tot.results[test] &&
                tests_1.default[test]["result"] === "passed") {
                if (!practice) {
                    occurrences.push(1);
                }
                else {
                    occurrences.push(practice);
                }
            }
        }
        return occurrences;
    }
    getErrorOccurrencesByPage(test) {
        const occurrences = new Array();
        for (const page of this.pages || []) {
            const error = page.evaluation.tot.elems[tests_1.default[test]["test"]];
            if (page.evaluation.tot.results[test] &&
                tests_1.default[test]["result"] === "failed") {
                if (!error) {
                    occurrences.push(1);
                }
                else {
                    occurrences.push(error);
                }
            }
        }
        return occurrences;
    }
}
exports.Website = Website;
//# sourceMappingURL=website.js.map