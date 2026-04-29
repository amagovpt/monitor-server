import { QualWeb, QualwebOptions } from "@qualweb/core";
import { ACTRules } from "@qualweb/act-rules";
import { WCAGTechniques } from '@qualweb/wcag-techniques';
import { BestPractices } from "@qualweb/best-practices";
import { Counter } from "@qualweb/counter";


export async function evaluate(params: any): Promise<any> {

  const qualweb = new QualWeb({ adBlock: true, stealth: true });

  try {

    const excludeRules: string[] = [];
    const options: QualwebOptions = {
      modules: [
        new ACTRules({ exclude: excludeRules }),
        new WCAGTechniques(),
        new BestPractices(),
        new Counter()
      ],
      waitUntil: ["load", "networkidle2"],
      log: { file: true }
    };

    if (params.url || params.urls) {
      options.url = params.url;
      options.urls = params.urls;
    } else if (params.html) {
      options.html = params.html;
    } else {
      throw new Error("Missing input: url, urls or html is required.");
    }


    
    await qualweb.start(
      { 
        maxConcurrency: 2, 
        timeout: 1000 * 240 * 2 
      },
      {
        headless: true,
        args: [
          "--no-sandbox", 
          "--ignore-certificate-errors",
         // "--disable-features=IsolateSandboxedIframes",
         // '--disable-site-isolation-trials',
          "--disable-setuid-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--disable-blink-features=AutomationControlled",
          "--disable-extensions",
          "--no-zygote",
          '--user-agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"',
          "--lang=pt-pt,pt"
        ]
      }
    );

    console.log(" QualWeb Cluster iniciado com sucesso.");

    const reports = await qualweb.evaluate(options);


    if (!reports || (Object.keys(reports).length === 0 && params.url)) {
      throw new Error("Invalid resource: QualWeb returned an empty report.");
    }

    return reports;

  } catch (err: any) {

    console.error(`[QualWeb Evaluation Failed]: ${err.message}`);
    

    throw err; 

  } finally {

    try {
      await qualweb.stop();
    } catch (stopError) {

    console.error(`[QualWeb Stop Failed]: ${stopError instanceof Error ? stopError.message : stopError}`);
  }
  }
}