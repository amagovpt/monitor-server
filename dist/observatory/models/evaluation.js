"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Evaluation = void 0;
class Evaluation {
    constructor(id, title, score, errors, tot, A, AA, AAA, evaluationDate) {
        this.id = id;
        this.title = title;
        this.score = parseFloat(score.toFixed(1));
        this.errors = JSON.parse(Buffer.from(errors, "base64").toString());
        this.tot = JSON.parse(Buffer.from(tot, "base64").toString());
        this.A = A;
        this.AA = AA;
        this.AAA = AAA;
        this.evaluationDate = evaluationDate;
    }
}
exports.Evaluation = Evaluation;
//# sourceMappingURL=evaluation.js.map