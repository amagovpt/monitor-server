import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEvaluation } from "./entities/user-evaluation.entity";
import { UserEvaluationService } from "./user-evaluation.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEvaluation])],
  providers: [UserEvaluationService],
  exports: [UserEvaluationService],
})
export class UserEvaluationModule {}
