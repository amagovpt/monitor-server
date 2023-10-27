
export class ShareCodeDto {
  websiteData: string|number;
  checklistId: number;
  shareCode: string;
  constructor(websiteData: string|number, checklistId: number, shareCode: string) {
    this.websiteData = websiteData;
    this.checklistId = checklistId;
    this.shareCode = shareCode
   }
}