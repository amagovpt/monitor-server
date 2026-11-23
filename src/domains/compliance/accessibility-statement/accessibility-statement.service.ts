import { Injectable, NotFoundException } from '@nestjs/common';
import { State } from './state';
import { AccessibilityStatementResponseDto } from './dto/accessibility-statement.response.dto';
import { AccessibilityStatementRepository } from './accessibility-statement.repository';
import { AccessibilityStatement } from './entities/accessibility-statement.entity';
import objectHash from 'object-hash';
import { AuthenticatedUser } from 'src/core/authentication/interfaces/types';
import { AccessibilityStatementQueryDTO } from './dto/request/accessibility-statement-request.dto';

@Injectable()
export class AccessibilityStatementService {
  constructor(private readonly repo: AccessibilityStatementRepository) {}

  async findById(id: number): Promise<AccessibilityStatement> {
    const statement = await this.repo.findOneBy({ id });
    if (!statement) {
      throw new NotFoundException(`AccessibilityStatement with id ${id} not found`);
    }
    return statement;
  }

  async deleteById(id: number) {
    return await this.repo.delete(id);
  }

  async getAll(user: AuthenticatedUser, query: AccessibilityStatementQueryDTO) {
    return await this.repo.findMany(query);
  }

  async upsertStatement(dto: AccessibilityStatementResponseDto): Promise<AccessibilityStatement> {
    const websiteId = Number(dto.websiteId);

    const existingStatement = await this.repo.findOneBy({ websiteId });

    const hashValue = this.generateHash(dto);

    if (existingStatement?.hash === hashValue) {
      return existingStatement;
    }

    const statement = existingStatement || new AccessibilityStatement();

    Object.assign(statement, {
      websiteId,
      conformance: dto.conformance,
      evidence: dto.evidence,
      seal: dto.seal,
      statementDate: dto.statementDate,
      state: this.calculateFlag(dto),
      hash: hashValue,
    });

    return await this.repo.save(statement);
  }

  private generateHash(dto: AccessibilityStatementResponseDto): string {
    return objectHash({
      conformance: dto.conformance,
      evidence: dto.evidence,
      seal: dto.seal,
      statementDate: dto.statementDate,
    });
  }

  private calculateFlag(dto: AccessibilityStatementResponseDto): State {
    const hasConformance = !!dto.conformance;
    const hasDate = !!dto.statementDate;

    if (hasConformance && hasDate) return State.completeStatement;
    if (!hasConformance && !hasDate) return State.possibleStatement;

    return State.incompleteStatement;
  }
}
