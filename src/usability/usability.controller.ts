import {BadRequestException, Controller, Get, Param, Put} from "@nestjs/common";
import {ChecklistManagerService} from "./checklist-manager.service";
import {ListUsabilityDeclaration} from "./model/list-usability-declaration";
import {UsabilityDeclarationService} from "./declaration/usability-declaration.service";
import {UsabilityError} from "./util/usability.error";
import {UsabilityChecklist} from "./model/usability-checklist";

// TODO: add @UseGuards
@Controller('usability')
export class UsabilityController {

    constructor(private readonly usabilityService: ChecklistManagerService,
                private readonly usabilityDeclarationService: UsabilityDeclarationService) {
    }

    @Get()
    public async listUsabilityDeclarations(): Promise<ListUsabilityDeclaration> {
        const processedUsabilityDeclarations = await this.usabilityDeclarationService.getAllProcessedDeclarations()
        const nonProcessedUsabilityDeclarations = await this.usabilityDeclarationService.getAllNonProcessedDeclarations()
        return new ListUsabilityDeclaration(processedUsabilityDeclarations, nonProcessedUsabilityDeclarations)
    }

    @Put("/processed/:declarationId")
    public async markUsabilityDeclarationAsProcessed(@Param('declarationId') declarationId: number): Promise<void> {
        try {
            await this.usabilityDeclarationService.markUsabilityDeclarationAsProcessed(declarationId);
        } catch (e) {
            if (e instanceof UsabilityError) {
                throw new BadRequestException(e.message);
            }
        }
    }

    @Get("/:declarationId")
    public async fetchDeclarationChecklistDetails(@Param('declarationId') declarationId: number): Promise<UsabilityChecklist> {
        return this.usabilityService.fetchUsabilityDeclarationDataFromChecklistManager(declarationId);
    }
}
