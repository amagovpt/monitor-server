import htmlparser2 from 'htmlparser2';
const CSSselect = require("css-select");
export class PageParser {
    public urls = new Array<string>();
    private dom: any;//fixme
    private static readonly SELECTORS = ['.mr-manual-summary', '. mr-date', '.mr', '.mr-conformance-status', '.mr-t-type'];

    constructor(html: string) {
        this.dom = htmlparser2.parseDocument(html);
    }

    public verifyAccessiblityStatement(): boolean {
        return PageParser.SELECTORS.reduce((result, selector) => {
            const list = CSSselect.selectAll(selector, this.dom);
            return result && list.length > 0;
        }, true);
    }
}
