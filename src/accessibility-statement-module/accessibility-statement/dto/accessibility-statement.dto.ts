import { CreateAutomaticEvaluationDto } from "src/accessibility-statement-module/automatic-evaluation/dto/create-automatic-evaluation.dto";
import { CreateContactDto } from "src/accessibility-statement-module/contact/dto/create-contact.dto";
import { CreateManualEvaluationDto } from "src/accessibility-statement-module/manual-evaluation/dto/create-manual-evaluation.dto";
import { CreateUserEvaluationDto } from "src/accessibility-statement-module/user-evaluation/dto/create-user-evaluation.dto";
import { State } from "../state";

export class AccessibilityStatementDto {
  url: string;
  conformance: string;
  statementDate: Date;
  state?: State;
  autoList: Array<CreateAutomaticEvaluationDto>;
  userList: Array<CreateUserEvaluationDto>;
  manualList: Array<CreateManualEvaluationDto>;
  contacts: Array<CreateContactDto>;
}
