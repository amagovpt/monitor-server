import { Test, TestingModule } from '@nestjs/testing';
import { HTML } from './contantsTest';
import { PageParser } from './page-parser';

describe('PageParser', () => {
  let parser: PageParser;

  beforeEach(async () => {
    parser = new PageParser(HTML);
  });

  it('should be defined', () => {
    expect(parser).toBeDefined();
    const result = parser.getAccessiblityStatementData("https://www.acessibilidade.gov.pt/acessibilidade/");
    console.log(result);
    const automatic = parser.getAutomaticEvaluationData();
    const manual = parser.getManualEvaluationData();
    const user = parser.getUserEvaluationData();
    console.log({automatic, manual, user});
  });
});
