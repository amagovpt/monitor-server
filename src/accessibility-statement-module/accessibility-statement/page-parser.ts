import { AUTOMATIC, CONFORMANCE_OUTPUT, DATE, EVIDENCE, MANUAL, PROCEDURE, SEAL, SELECTORS, USER } from "./contants";

const htmlparser2 = require("htmlparser2");
const CSSselect = require("css-select");
export class PageParser {
    public urls = new Array<string>();
    private dom: any;

    constructor(html: string) {
        this.dom = htmlparser2.parseDocument(html);
    }

    public verifyAccessiblityPossibleStatement(url: string): boolean {
        return url.includes("/acessibilidade") || this.verifyAccessiblityPossibleStatementTitle()
    }

    public verifyAccessiblityPossibleStatementTitle(): boolean {
        const title = CSSselect.selectOne('title', this.dom);
        const h1 = CSSselect.selectOne('h1', this.dom);
        let result = false;
        if (h1) {
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
        return this.getDataFromSelector(CONFORMANCE_OUTPUT)
    }

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
        else {
            return new Date(dateString)
        }
    }

    public getAccessiblityStatementData(url: string) {
        return {
            statementDate: this.getDate(),
            evidence: this.getEvidence(),
            seal: this.getSeal(),
            conformance: this.getConformance(),
            url,        }
    }

    public getUserEvaluationData() {
        try {
            return this.processProcedure(USER);
        }
        catch (e) {
            console.log(e);
            return [];
        }
    }

    public getAutomaticEvaluationData() {
        try {
            return this.processProcedure(AUTOMATIC);
        }
        catch (e) {
            console.log(e);
            return [];
        }
    }

    public getManualEvaluationData() {
        try {
            return this.processProcedure(MANUAL);
        }
        catch (e) {
            console.log(e);
            return [];
        }
    }

    public processProcedure(procedure) {
        const procedureJson = PROCEDURE[procedure];
        const selector = procedureJson.selector;
        const element = CSSselect.selectOne(selector, this.dom);
        const list = CSSselect.selectOne('ol', element);
        const listElements = list.children;
        const data = procedureJson.data;
        return listElements.flatMap((li) => {
            if (li.name === 'li')
                return this.processProcedureElement(data, li);
            else
                return [];
        });
    }
    private processProcedureElement(data, element) {
        const Date = this.getDateProcedure(element);
        const link = CSSselect.selectOne('a', element);
        const Url = link.attribs.href;
        const Title = this.getText(link);
        const otherData = this.getOtherProcedureData(element, data);
        return { Date, Url, Title, ...otherData };
    }

    private getOtherProcedureData(element, data) {
        const list = CSSselect.selectOne('ul', element);
        const listElements = list.children;
        const result = {};
        listElements.flatMap((li) => {
            const text = this.getText(li);
            if (text&&text.trim()) {
                const splittedText = text.split(":");
                const attName = splittedText[0];
                let content = splittedText[1];
                if (attName === 'Amostra')
                    content = content.replace(/[^\d]/g, '');
                result[data[attName]] = content;
            }
            else
                return [];
        });
        return result;
    }


    private getDateProcedure(element) {
        const text = this.getText(element);
        const splittedText = text.split(/[()]/);
        return splittedText[1];
    }


    private getDataFromSelector(select: string) {
        const element = CSSselect.selectOne(select, this.dom);
        if (!element)
            return null;
        else {
            return this.getText(element);
        }
    }

    private getText(element: any): string {
        const children = element.children;
        let text = "";
        if (element.type === 'text')
            text = text + element.data;
        children?.map((child) => {
            text = text + this.getTextRecursion(child)
        });
        return text;
    }
    private getTextAux(element: any): string {
        const children = element.children;
        let text = "";
        children?.map((child) => {
            text = text + this.getTextRecursion(child)
        });
        return text;
    }
    private getTextRecursion(child) {
        let text = "";
        if (child.type === 'text')
            text = text + child.data;
        text = text + this.getTextAux(child);
        return text;
    }
}
