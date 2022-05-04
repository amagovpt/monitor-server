import { CONFORMANCE_OUTPUT, DATE, EVIDENCE, SEAL, SELECTORS } from "./contants";

const htmlparser2 = require("htmlparser2");
const CSSselect = require("css-select");
export class PageParser {
    public urls = new Array<string>();
    private dom: any;

    constructor(html: string) {
        this.dom = htmlparser2.parseDocument(html);
    }

    public verifyAccessiblityPossibleStatement(url:string): boolean {
        return url.includes("/acessibilidade") || this.verifyAccessiblityPossibleStatementTitle()
    }

    public verifyAccessiblityPossibleStatementTitle(): boolean {
        const title = CSSselect.selectOne('title', this.dom);
        const h1 = CSSselect.selectOne('h1', this.dom);
        let result = false;
        if (h1){
            const text = this.getText(h1).toLowerCase();
            result = text.includes("acessibilidade") && text.includes("declaração");
        }
        if (!result && title && title.data) {
            const text = this.getText(title).toLowerCase();
            result = text.includes("acessibilidade") && text.includes("declaração");
        }
        return result;
    }


    public verifyAccessiblityStatement(): boolean {
        return SELECTORS.reduce((result, selector) => {
            const list = CSSselect.selectAll(selector, this.dom);
            return result && list.length > 0;
        }, true);
    }
    public getConformance(): string {
        return this.getDataFromSelector(CONFORMANCE_OUTPUT)}

    public getSeal(): string {
        return this.getDataFromSelector(SEAL)
    }

    public getEvidence(): string {
        return this.getDataFromSelector(EVIDENCE)
    }

    public getDate(): Date {
        const dateString = this.getDataFromSelector(DATE);
        if (!dateString)
            return null;
        else{
            return new Date(dateString)}
    }

    public getAccessiblityStatementData(){
        return {
            date: this.getDate(),
            evidence : this.getEvidence(),
            seal: this.getSeal(),
            conformance: this.getConformance(),
        }
    }

    private getDataFromSelector(select:string){
        const element = CSSselect.selectOne(select, this.dom);
        if (!element)
            return null;
        else {
            return this.getText(element);
        }
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
