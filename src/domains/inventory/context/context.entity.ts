import { Entity, PrimaryGeneratedColumn, Column, Unique } from "typeorm";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";

@Entity("contexts")
@Unique("UQ_context_code", ["code"])
export class Context implements IdentifiableModel {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ type: "varchar", length: 50, nullable: false })
  code: string; 

  @Column({ type: "varchar", length: 255, nullable: true })
  name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string;
}