import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransactionAspectsService } from "./transaction-aspects.service";
import { TransactionAspects } from "./transaction-aspects.entity";
import { TransactionAspectsController } from "./transaction-aspects.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionAspects])
  ],
  exports: [TransactionAspectsService],
  providers: [TransactionAspectsService],
  controllers: [TransactionAspectsController],
})
export class TransactionAspectsModule {}
