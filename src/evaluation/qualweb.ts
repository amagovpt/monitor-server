import * as core from '@qualweb/core';

export async function init(): Promise<void> {
  await core.start();
}

export async function evaluate(params: any): Promise<any> {
  const report = (await core.evaluate({
    url: params.url,
    'act-rules': {
      rules: [
        'QW-ACT-R1', 
        'QW-ACT-R2', 
        'QW-ACT-R3', 
        'QW-ACT-R4', 
        'QW-ACT-R5', 
        'QW-ACT-R6', 
        //'QW-ACT-R9', 
        'QW-ACT-R16', 
        'QW-ACT-R17', 
        'QW-ACT-R18', 
        'QW-ACT-R19'
      ]
    },
    'html-techniques': {
      techniques: [
        'QW-HTML-T1',
        'QW-HTML-T2',
        'QW-HTML-T3',
        'QW-HTML-T6',
        'QW-HTML-T7',
        'QW-HTML-T8',
        'QW-HTML-T9',
        'QW-HTML-T17',
        'QW-HTML-T19',
        'QW-HTML-T20',
        'QW-HTML-T25',
        'QW-HTML-T28',
        'QW-HTML-T29',
        'QW-HTML-T30',
        'QW-HTML-T32',
        'QW-HTML-T34',
        'QW-HTML-T35',
        'QW-HTML-T37',
        'QW-HTML-T38',
        'QW-HTML-T40', //TODO: needs fix - error on https://lodash.com/docs/4.17.15
        'QW-HTML-T41',
        'QW-HTML-T42',
        'QW-HTML-T43', //TODO: needs fix - error on https://lodash.com/docs/4.17.15
      ]
    },
    'css-techniques': {
      techniques: [
        'QW-CSS-T1',
        'QW-CSS-T2',
        'QW-CSS-T3',
        'QW-CSS-T5',
        'QW-CSS-T6',
        'QW-CSS-T7'
      ]
    },
    'best-practices': {
      bestPractices: [
        'QW-BP1',
        'QW-BP2',
        'QW-BP3',
        'QW-BP4',
        'QW-BP5',
        'QW-BP6',
        'QW-BP7',
        'QW-BP8', //TODO: needs fix - error on https://rtp.pt
        'QW-BP9',
        'QW-BP10',
        'QW-BP11',
        'QW-BP13',
        'QW-BP14',
        'QW-BP15',
        'QW-BP16'
      ]
    }
  }))[params.url];
  
  return report;
}