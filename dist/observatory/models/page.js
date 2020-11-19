"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Page = void 0;
const evaluation_1 = require("./evaluation");
class Page {
    constructor(id, uri, creationDate) {
        this.id = id;
        this.uri = uri;
        this.creationDate = creationDate;
    }
    addEvaluation(id, title, score, errors, tot, A, AA, AAA, evaluationDate) {
        this.evaluation = new evaluation_1.Evaluation(id, title, score, errors, tot, A, AA, AAA, evaluationDate);
    }
}
exports.Page = Page;
//# sourceMappingURL=page.js.map