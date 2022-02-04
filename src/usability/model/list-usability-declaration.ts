import {UsabilityDeclarationModel} from "./usability-declaration.model";

export class ListUsabilityDeclaration {
    public processed: Array<UsabilityDeclarationModel>
    public nonProcessed: Array<UsabilityDeclarationModel>

    constructor(processed?: Array<UsabilityDeclarationModel>,
                nonProcessed?: Array<UsabilityDeclarationModel>) {
        this.processed = processed ? processed : new Array<UsabilityDeclarationModel>()
        this.nonProcessed = nonProcessed ? nonProcessed : new Array<UsabilityDeclarationModel>()
    }
}
