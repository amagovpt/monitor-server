import { DomHandler, Parser } from 'htmlparser2';
import { Node } from 'domhandler';
import { findAll } from 'domutils';

export class PageParser {
    private static domHandler = new DomHandler();
    public static urls = new Array<string>();

    static parseHtml(html: string): Array<string> {
        PageParser.urls = new Array<string>();
        PageParser.initDomHandler();
        const parser = new Parser(PageParser.domHandler);
        parser.write(html);
        parser.end();
        return PageParser.urls;
    }

    private static initDomHandler() {
        PageParser.domHandler = new DomHandler((error, dom) => {
            if (error) {
                throw Error(error.message);
            } else {
                PageParser.parseDom(dom);
            }
        });
    }

    private static parseDom(dom: Node[]): void {
        const usabilityDeclarations = findAll(
            (el) => !!el.attribs.href && PageParser.isDeclaration(el.attribs.href),
            dom,
        );
        usabilityDeclarations.forEach((el) =>
            PageParser.urls.push(el.attribs.href),
        );
    }

    private static isDeclaration(href: string): boolean {
        return (
            href.toLowerCase().endsWith('aspetos.html') ||
            href.toLowerCase().endsWith('conteudo.html') ||
            href.toLowerCase().endsWith('transacao.html')
        );
    } // accstmnt_assessment_with_manual_address_1
}
