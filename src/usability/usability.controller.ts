import {BadRequestException, Controller, Get, Param, Put} from "@nestjs/common";
import {ListUsabilityDeclaration} from "./model/list-usability-declaration";
import {UsabilityDeclarationService} from "./declaration/usability-declaration.service";
import {UsabilityError} from "./util/usability.error";

// TODO: add @UseGuards
@Controller('usability')
export class UsabilityController {

    constructor(
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
        await this.masUsabilityDeclarationAs(declarationId, true);
    }

    @Put("/non-processed/:declarationId")
    public async markUsabilityDeclarationAsNonProcessed(@Param('declarationId') declarationId: number): Promise<void> {
        await this.masUsabilityDeclarationAs(declarationId, false);
    }

    private async masUsabilityDeclarationAs(declarationId: number, processed: boolean) {
        try {
            await this.usabilityDeclarationService.markUsabilityDeclarationAs(declarationId, processed);
        } catch (e) {
            if (e instanceof UsabilityError) {
                throw new BadRequestException(e.message);
            }
        }
    }
}
