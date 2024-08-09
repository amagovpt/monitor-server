const SELECTORS = [
  ".mr-manual-summary",
  ".mr-date",
  ".mr",
  ".mr-conformance-status",
  ".mr-t-type",
];
const CONFORMANCE_OUTPUT = ".conformance-output";
const DATE = ".mr-date";
const TARGET_SELECTOR = ".target-type";
const AUTOMATIC_EVALUATION = ".mr-automatic-summary";
const MANUAL_EVALUATION = ".mr-manual-summary";
const USER_EVALUATION = ".mr-users-summary";
const CONTACTS = ".mr-contacts dl";
const SEAL = ".mr-seal";
const EVIDENCE = "#accstmnt_additional_evidence_summary";
const AUTOMATIC_EVALUATION_ATTRIBUTES = {
  //title conteudo a
  //url link a
  //date inicio entre parenteses
  "Ferramenta utilizada": "Tool",
  Amostra: "Sample",
  "Principais resultados (sumário)": "Summary",
};
const MANUAL_EVALUATION_ATTRIBUTES = {
  //title conteudo a
  //url link a
  //date inicio entre parenteses
  "Ferramenta utilizada": "Tool",
  Amostra: "Sample",
  "Principais resultados (heurísticas satisfeitas/total heurísticas aplicadas)":
    "Heuristics",
};
const USER_EVALUATION_ATTRIBUTES = {
  //title conteudo a
  //url link a
  //date inicio entre parenteses
  "Caraterização dos participantes": "Participants",
  "Tarefas/Processos": "Process",
  "Principais resultados (sumário)": "Summary",
};
const AUTOMATIC = "automatic";
const MANUAL = "manual";
const USER = "user";
const PROCEDURE = {
  automatic: {
    selector: AUTOMATIC_EVALUATION,
    data: AUTOMATIC_EVALUATION_ATTRIBUTES,
  },
  manual: { selector: MANUAL_EVALUATION, data: MANUAL_EVALUATION_ATTRIBUTES },
  user: { selector: USER_EVALUATION, data: USER_EVALUATION_ATTRIBUTES },
};
const PLENAMENTE_CONFORME = "plenamente conforme";
const PARCIALMENTE_CONFORME = "parcialmente conforme";
const NAO_CONFORME = "não conforme";
const OURO = "ouro";
const PRATA = "prata";
const BRONZE = "bronze";

export {
  SELECTORS,
  CONFORMANCE_OUTPUT,
  DATE,
  TARGET_SELECTOR,
  SEAL,
  EVIDENCE,
  PROCEDURE,
  AUTOMATIC,
  MANUAL,
  USER,
  CONTACTS,
  PLENAMENTE_CONFORME,
  PARCIALMENTE_CONFORME,
  NAO_CONFORME,
  OURO,
  PRATA,
  BRONZE,
};
