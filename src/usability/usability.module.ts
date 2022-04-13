import {Module} from "@nestjs/common";
import {UsabilityDeclarationService} from "./declaration/usability-declaration.service";
import {HttpModule} from "@nestjs/axios";
import {TypeOrmModule} from "@nestjs/typeorm";
import {UsabilityDeclaration} from "./declaration/usability-declaration.entity";
import {Page} from "../page/page.entity";
import { UsabilityController } from "./usability.controller";

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([Page, UsabilityDeclaration])
    ],
    providers: [
        UsabilityDeclarationService,
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
