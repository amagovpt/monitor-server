import { State } from '../state';

export class AccessibilityStatementResponseDto {
  websiteId: string;
  conformance: string;
  evidence: string;
  seal: string;
  statementDate: Date;
  state?: State;
}
