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
    const automatic = parser.processProcedure("automatic");
    const manual = parser.processProcedure("manual");
    const user = parser.processProcedure("user");
    console.log({automatic, manual, user});
  });
});
