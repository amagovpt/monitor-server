import { QualWeb, EvaluationReport, QualwebOptions } from "@qualweb/core";

export async function evaluate(params: any): Promise<any> {
  const options: QualwebOptions = {
    execute: {
      act: true,
      wcag: true,
      bp: true,
      counter: true,
    },
    "act-rules": {
      rules: [
        "QW-ACT-R1",
        "QW-ACT-R2",
        "QW-ACT-R3",
        "QW-ACT-R4",
        "QW-ACT-R5",
        "QW-ACT-R6",
        "QW-ACT-R9",
        "QW-ACT-R15",
        "QW-ACT-R16",
        "QW-ACT-R17",
        "QW-ACT-R18",
        "QW-ACT-R19",
        "QW-ACT-R24",
        "QW-ACT-R25",
        "QW-ACT-R27",
        "QW-ACT-R33",
        "QW-ACT-R34",
        "QW-ACT-R35",
        "QW-ACT-R37",
        "QW-ACT-R38",
        "QW-ACT-R68",
      ],
    },
    "wcag-techniques": {
      techniques: [
        "QW-WCAG-T1",
        "QW-WCAG-T2",
        //"QW-WCAG-T3",
        "QW-WCAG-T6",
        "QW-WCAG-T7",
        "QW-WCAG-T8",
        "QW-WCAG-T9",
        "QW-WCAG-T14",
        "QW-WCAG-T15",
        "QW-WCAG-T17",
        //"QW-WCAG-T32",
        "QW-WCAG-T18",
        "QW-WCAG-T19",
        "QW-WCAG-T20",
        "QW-WCAG-T21",
        "QW-WCAG-T22",
        "QW-WCAG-T23",
        "QW-WCAG-T24",
        "QW-WCAG-T25",
        "QW-WCAG-T26",
        "QW-WCAG-T27",
        "QW-WCAG-T28",
        "QW-WCAG-T29",
        "QW-WCAG-T30",
        "QW-WCAG-T31",
      ],
    },
    "best-practices": {
      bestPractices: [
        "QW-BP1",
        "QW-BP2",
        "QW-BP3",
        "QW-BP5",
        "QW-BP6",
        "QW-BP7",
        "QW-BP8",
        "QW-BP9",
        "QW-BP10",
        "QW-BP11",
        "QW-BP13",
        "QW-BP14",
        "QW-BP15",
        "QW-BP17",
        "QW-BP18",
      ],
    },
    waitUntil: ["load", "networkidle0"],
  };

  if (params.url || params.urls) {
    if (process.env.VALIDATOR) {
      options["wcag-techniques"].techniques.push("QW-WCAG-T16");
    }
    options.url = params.url;
    options.urls = params.urls;
  } else if (params.html) {
    options.html = params.html;
  }

  options.log = { file: true };

  if (process.env.VALIDATOR) {
    options["validator"] = process.env.VALIDATOR;
  }

  const qualweb = new QualWeb({ stealth: true });
  await qualweb.start(
    { maxConcurrency: 2, timeout: 1000 * 60 * 2 },
    {
      args: ["--no-sandbox", "--ignore-certificate-errors", "--lang=pt-pt,pt"],
    }
  );

  let reports = null;
  let error = null;
  try {
    reports = await qualweb.evaluate(options);
  } catch (err) {
    error = err;
  } finally {
    await qualweb.stop();
  }

  if (reports === null) {
    throw new Error(error);
  }

  if (Object.keys(reports).length === 0 && params.url) {
    throw new Error("Invalid resource");
  }

  return reports;
}
