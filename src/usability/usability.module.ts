import {Module} from "@nestjs/common";
import {UsabilityDeclarationService} from "./declaration/usability-declaration.service";
import {UsabilityStatisticsService} from "./statistics/usability-statistics.service";
import {HttpModule} from "@nestjs/axios";
import {TypeOrmModule} from "@nestjs/typeorm";
import {UsabilityDeclaration} from "./declaration/usability-declaration.entity";
import {Page} from "../page/page.entity";
import {ChecklistManagerService} from "./checklist-manager.service";
import {UsabilityController} from "./usability.controller";

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([Page, UsabilityDeclaration])
    ],
    providers: [
        ChecklistManagerService,
        UsabilityDeclarationService,
        UsabilityStatisticsService
    ],
    controllers: [
        UsabilityController
    ],
    exports: [
        UsabilityDeclarationService
    ],
})
export class UsabilityModule {
}
