export declare class StampService {
    generateAllWebsitesDigitalStamp(): Promise<any>;
    generateWebsiteDigitalStamp(websiteId: number, name: string): Promise<boolean>;
    private generateSVG;
    private addText;
    private addCircle;
    private addPath;
}
