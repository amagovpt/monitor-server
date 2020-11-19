import { Evaluation } from './evaluation';
export declare class Page {
    id: number;
    uri: string;
    creationDate: Date;
    evaluation: Evaluation;
    constructor(id: number, uri: string, creationDate: Date);
    addEvaluation(id: number, title: string, score: number, errors: any, tot: any, A: number, AA: number, AAA: number, evaluationDate: Date): void;
}
