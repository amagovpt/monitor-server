import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Invalid_Token')
export class InvalidToken {

  @PrimaryGeneratedColumn({
    type: 'int'
  })
  TokenId: number;

  @Column({
    type: 'text',
    nullable: false
  })
  Token: string;

  @Column({
    type: 'datetime',
    nullable: false
  })
  Expiration_Date: any;
}