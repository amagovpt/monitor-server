import { Website } from 'src/website/website.entity';
import { Entity, Column, PrimaryGeneratedColumn,OneToOne,JoinColumn} from 'typeorm';

@Entity('share_code')
export class ShareCode{
    @PrimaryGeneratedColumn({
        type: 'int'
      })
      id: number;
      
      @Column({
        type: 'int',
        nullable: false,
        name:"checklist_id"
      })
      checklistId: number;

      @OneToOne(() => Website)
      @JoinColumn({name:"website_id",referencedColumnName:"WebsiteId"})
      website: Website;

      @Column({
        type: 'text',
        nullable: false,
        name:"share_code"
      })
      shareCode: string;

      @Column({
        type: 'date',
        nullable: false,
        name:"expiry_date"
      })
      expiryDate: Date;

      constructor(checklistId:number,website:Website,shareCode:string){
        this.checklistId = checklistId;
        this.shareCode = shareCode;
        this.website = website;
        this.expiryDate = new Date();
        this.expiryDate = new Date(this.expiryDate.getFullYear(),this.expiryDate.getMonth() + 1,this.expiryDate.getDate());
        console.log(this.expiryDate);
      }
}