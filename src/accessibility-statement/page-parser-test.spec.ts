import { HTML } from './contantsTest';
import { PageParser } from './page-parser';
import { Test, TestingModule } from '@nestjs/testing';


describe('PageParser', () => {
  let parser: PageParser;

  beforeEach(async () => {
    parser = new PageParser(HTML);
  });

  it('should be defined', () => {
    expect(parser).toBeDefined();
    const result = parser.getAccessiblityStatementData();
    console.log(result);
  });
});
