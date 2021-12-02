import {Injectable} from "@nestjs/common";
import {Evaluation} from "../../evaluation/evaluation.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {UsabilityDeclaration, UsabilityDeclarationWebsiteName} from "./usability-declaration.entity";
import {Repository} from "typeorm";
import {UsabilityDeclarationCompliance, UsabilityDeclarationModel} from "../model/usability-declaration.model";
import {UsabilityError} from "../util/usability.error";
import {PageParser} from "../util/page-parser";

@Injectable()
export class UsabilityDeclarationService {

    constructor(
        @InjectRepository(UsabilityDeclaration)
        private readonly usabilityDeclarationRepository: Repository<UsabilityDeclaration>) {
    }

    public async findDeclarationsFromNewEvaluations(evaluation: Evaluation): Promise<void> {
        const rawHtml = Buffer.from(evaluation.Pagecode, "base64").toString();
        const declarationUrls = PageParser.parseHtml(rawHtml)
        if (declarationUrls.length > 0) {
            await this.saveUsabilityDeclaration({
                PageId: evaluation.PageId,
                DeclarationUrls: declarationUrls.toString(),
            });
        }
    }

    public async getAllDeclarations(): Promise<Array<UsabilityDeclaration>> {
        return this.usabilityDeclarationRepository.find();
    }

    public async getDeclarationsById(id: number): Promise<UsabilityDeclaration> {
        return this.usabilityDeclarationRepository.findOneOrFail(id);
    }

    public async getDeclarationsByPageId(pageId: number): Promise<Array<UsabilityDeclaration>> {
        return this.usabilityDeclarationRepository.find({where: {PageId: pageId}});
    }

    public async getAllProcessedDeclarations(): Promise<Array<UsabilityDeclarationModel>> {
        const usabilityDeclarations = await this.getAllDeclarationsByProcessed(true);
        return usabilityDeclarations.map((declaration) => UsabilityDeclarationModel.toModel(declaration))
    }

    public async getAllNonProcessedDeclarations(): Promise<Array<UsabilityDeclarationModel>> {
        const usabilityDeclarations = await this.getAllDeclarationsByProcessed(false);
        return usabilityDeclarations.map((declaration) => UsabilityDeclarationModel.toModel(declaration))
    }

    public async markUsabilityDeclarationAsProcessed(declarationId: number): Promise<void> {
        const declaration = await this.getDeclarationsById(declarationId)
        if (declaration.Processed) {
            throw new UsabilityError("Unexpected Error: Usability Declaration is already processed.")
        }
        await this.usabilityDeclarationRepository.update(declaration.UsabilityDeclarationId, {
            Processed: true,
        });
    }

    public async getAllNonSynced(): Promise<Array<UsabilityDeclaration>> {
        return this.usabilityDeclarationRepository.find({where: {Synced: false}})
    }

    public async markUsabilityDeclarationAsSyncedAndFillComplianceData(declaration: UsabilityDeclaration, compliance: UsabilityDeclarationCompliance): Promise<void> {
        if (declaration.Synced) {
            throw new UsabilityError("Unexpected Error: Usability Declaration is already synced.")
        }
        await this.usabilityDeclarationRepository.update(declaration.UsabilityDeclarationId, {
            Synced: true,
            UsabilityDeclarationId: declaration.UsabilityDeclarationId,
            FunctionalAspectsCompliance: compliance.functionalAspects,
            ContentCompliance: compliance.content,
            TransactionCompliance: compliance.transaction
        });
    }

    public async deleteUsabilityDeclaration(declarationId: number): Promise<void> {
        await this.usabilityDeclarationRepository.delete({UsabilityDeclarationId: declarationId});
    }

    private async saveUsabilityDeclaration(param: Partial<UsabilityDeclaration>): Promise<void> {
        await this.usabilityDeclarationRepository.save(param);
    }

    private async getAllDeclarationsByProcessed(processed: boolean): Promise<Array<UsabilityDeclarationWebsiteName>> {
        return this.usabilityDeclarationRepository.query(`
            SELECT UD.*, W.Name FROM Usability_Declaration UD
                INNER JOIN Page P ON UD.PageId = P.PageId
                INNER JOIN DomainPage DP ON P.PageId = DP.PageId
                INNER JOIN Domain D ON DP.DomainId = D.DomainId
                INNER JOIN Website W ON D.WebsiteId = W.WebsiteId
            WHERE UD.Processed = ?;
        `, [processed])
    }

    public async getDeclarationWebsiteId(usabilityDeclarationId: number): Promise<number> {
        const queryResult = await this.usabilityDeclarationRepository.query(`
            SELECT W.WebsiteId FROM Usability_Declaration UD
                INNER JOIN Page P ON UD.PageId = P.PageId
                INNER JOIN DomainPage DP ON P.PageId = DP.PageId
                INNER JOIN Domain D ON DP.DomainId = D.DomainId
                INNER JOIN Website W ON D.WebsiteId = W.WebsiteId
            WHERE UD.UsabilityDeclarationId = ?;
        `, [usabilityDeclarationId])
        return queryResult[0].WebsiteId
    }
}
