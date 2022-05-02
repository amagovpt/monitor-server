const htmlparser2 = require("htmlparser2");
const CSSselect = require("css-select");
export class PageParser {
    public urls = new Array<string>();
    private dom: any;
    private static readonly SELECTORS = ['.mr-manual-summary', '.mr-date', '.mr', '.mr-conformance-status', '.mr-t-type'];
    private static readonly CONFORMANCE_OUTPUT = '.conformance-output';
    private static readonly DATE = '.mr-date';


    constructor(html: string) {
        this.dom = htmlparser2.parseDocument(html);
    }

    public verifyAccessiblityStatement(): boolean {
        return PageParser.SELECTORS.reduce((result, selector) => {
            const list = CSSselect.selectAll(selector, this.dom);
            return result && list.length > 0;
        }, true);
    }
    public getConformance(): string {
        const conformanceSpan = CSSselect.selectOne(PageParser.CONFORMANCE_OUTPUT, this.dom);
        if(!conformanceSpan)
            return null;
        else{
            return this.getText(conformanceSpan);} }

    public getDate(): Date {
        const dateSpan = CSSselect.selectOne(PageParser.DATE, this.dom);

        if (!dateSpan)
            return null;
        else{
            const dateString = this.getText(dateSpan);
            console.log(dateString);
            return new Date(dateString)}
    }

    private getText(element:any): string {
        const children = element.children;
        let text = "";
        if(element.type === 'text')
            text = text + element.data;
        children?.map((child)=>{
            text = text + this.getTextRecursion(child)});
        return text;
    }
    private getTextAux(element: any): string {
        const children = element.children;
        let text = "";
        children?.map((child) => {
            text = text + this.getTextRecursion(child)
        });
        return text;}
    private getTextRecursion(child){
        let text = "";
        if (child.type === 'text')
            text = text + child.data;
        text = text + this.getTextAux(child);
        return text;
    }
}
