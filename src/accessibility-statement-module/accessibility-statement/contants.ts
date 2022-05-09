const SELECTORS = ['.mr-manual-summary', '.mr-date', '.mr', '.mr-conformance-status', '.mr-t-type'];
const CONFORMANCE_OUTPUT = '.conformance-output';
const DATE = '.mr-date';
const TARGET_SELECTOR = '.target-type';
const AUTOMATIC_EVALUATION = '.mr-automatic-summary';
const MANUAL_EVALUATION = '.mr-manual-summary';
const USER_EVALUATION = '.mr-users-summary';
const SEAL = '.mr-seal';
const EVIDENCE = '#accstmnt_additional_evidence_summary';
const AUTOMATIC_EVALUATION_ATTRIBUTES = {
    //title conteudo a
    //url link a
    //date inicio entre parenteses
    "Ferramenta utilizada": "tool",
    "Amostra": "sample",
    "Principais resultados (sumário)": "summary"
}
const MANUAL_EVALUATION_ATTRIBUTES = {
    //title conteudo a
    //url link a
    //date inicio entre parenteses
    "Ferramenta utilizada": "tool",
    "Amostra": "sample",
    "Principais resultados (heurísticas satisfeitas/total heurísticas aplicadas)": "heuristics_score"
}
const USER_EVALUATION_ATTRIBUTES = {
    //title conteudo a
    //url link a
    //date inicio entre parenteses
    "Caraterização dos participantes": "participants",
    "Tarefas/Processos": "process",
    "Principais resultados (sumário)": "summary"
}
const AUTOMATIC = 'automatic';
const MANUAL = 'manual';
const USER = 'user';
const PROCEDURE = {
    automatic: { selector: AUTOMATIC_EVALUATION, data: AUTOMATIC_EVALUATION_ATTRIBUTES},
    manual: { selector: MANUAL_EVALUATION, data: MANUAL_EVALUATION_ATTRIBUTES },
    user: { selector: USER_EVALUATION, data: USER_EVALUATION_ATTRIBUTES }
}

export { SELECTORS, CONFORMANCE_OUTPUT, DATE, TARGET_SELECTOR, SEAL, EVIDENCE, PROCEDURE, AUTOMATIC, MANUAL, USER}
