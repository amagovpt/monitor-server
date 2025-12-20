import { QualWeb, QualwebOptions } from "@qualweb/core";
import { ACTRules } from "@qualweb/act-rules";
import { WCAGTechniques } from '@qualweb/wcag-techniques';
import { BestPractices } from "@qualweb/best-practices";
import { Counter } from '@qualweb/counter';

export async function evaluate(params: any): Promise<any> {
  const actInstances = new ACTRules();
  const wcagInstances = new WCAGTechniques();  
  const bpInstances = new BestPractices();
  const counterInstances = new Counter();

  const options: QualwebOptions = {
    modules: [actInstances, wcagInstances, bpInstances, counterInstances],
    waitUntil: ["load", "networkidle2"],
  };

  if (params.url || params.urls) {
    options.url = params.url;
    options.urls = params.urls;
  } else if (params.html) {
    options.html = params.html;
  }

  options.log = { file: true };

  if (process.env.VALIDATOR) {
    options["validator"] = process.env.VALIDATOR;
  }

  const qualweb = new QualWeb({ adBlock: true, stealth: true });
  await qualweb.start(
    { maxConcurrency: 2, timeout: 1000 * 240 * 2 },
    {
      headless: true,
      args: ["--no-sandbox", "--ignore-certificate-errors", "--lang=pt-pt,pt"]
    },    
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
