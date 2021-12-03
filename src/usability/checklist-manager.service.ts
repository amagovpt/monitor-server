import {HttpStatus, Injectable} from "@nestjs/common";
import {lastValueFrom} from "rxjs";
import {HttpService} from "@nestjs/axios";
import {UsabilityChecklist} from "./model/usability-checklist";
import {UsabilityDeclarationService} from "./declaration/usability-declaration.service";
import {Cron, CronExpression} from "@nestjs/schedule";
import {UsabilityDeclarationCompliance, UsabilityDeclarationSyncModel} from "./model/usability-declaration.model";

@Injectable()
export class ChecklistManagerService {
    private readonly checklistManagerUrl: string;

    constructor(private readonly http: HttpService,
                private readonly usabilityDeclarationService: UsabilityDeclarationService) {
        this.checklistManagerUrl = "http://localhost:3001";
    }

    public async fetchUsabilityDeclarationDataFromChecklistManager(declarationId: number): Promise<UsabilityChecklist> {
        const usabilityChecklistAxiosResponse = await lastValueFrom(this.http.get<UsabilityChecklist>(`${this.checklistManagerUrl}/checklist/${declarationId}`))
        const usabilityChecklist = usabilityChecklistAxiosResponse.data
        const usabilityDeclaration = await this.usabilityDeclarationService.getDeclarationsById(usabilityChecklist.monitorServerId)

        const urls = usabilityDeclaration.DeclarationUrls
        usabilityChecklist.urls = urls.split(',')

        usabilityChecklist.websiteId = await this.usabilityDeclarationService.getDeclarationWebsiteId(usabilityDeclaration.UsabilityDeclarationId)

        return usabilityChecklist;
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    private async syncWithChecklistManager(): Promise<void> {
        const notSynced = await this.usabilityDeclarationService.getAllNonSynced()
        if (notSynced.length === 0) {
            return
        }
        for (const declaration of notSynced) {
            lastValueFrom(this.http.post<UsabilityDeclarationCompliance>(`${this.checklistManagerUrl}/checklist/sync/`, new UsabilityDeclarationSyncModel(declaration)))
                .then(async (response) => {
                    if (response.status == HttpStatus.CREATED) {
                        const compliance: UsabilityDeclarationCompliance = response.data
                        await this.usabilityDeclarationService.markUsabilityDeclarationAsSyncedAndFillComplianceData(declaration, compliance)
                    } else {
                        throw new Error(`Checklist sync responded with code: ${response.status}`)
                    }
                })
                .catch(() => {
                    this.usabilityDeclarationService.deleteUsabilityDeclaration(declaration.UsabilityDeclarationId)
                })
        }
    }
}