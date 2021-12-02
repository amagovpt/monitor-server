import {Injectable} from "@nestjs/common";
import {UsabilityStatistics} from "../model/usability-statistics";
import {HttpService} from "@nestjs/axios";
import {lastValueFrom} from "rxjs";

@Injectable()
export class UsabilityStatisticsService {

    constructor(private readonly http: HttpService) {
    }

    public async fetchStatisticsFromChecklistManager(): Promise<UsabilityStatistics> {
        // TODO: add url
        return lastValueFrom(this.http.get<UsabilityStatistics>(``));
    }
}
