import { CriteriaDTO } from "./criteria.dto";
import { WebSiteCriteriaNotesDTO } from "./website-criteria-notes.dto";

export class CriteriaFindAllDTO {
    criteria: CriteriaDTO[];
    notes: WebSiteCriteriaNotesDTO[];
    constructor() { }
}