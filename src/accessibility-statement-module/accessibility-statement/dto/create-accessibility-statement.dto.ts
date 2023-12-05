import { State } from "../state";

export class CreateAccessibilityStatementDto {
    url: string;
    conformance:string;
    statementDate: Date;
    state?:State;
}
