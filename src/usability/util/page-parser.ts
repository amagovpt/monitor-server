import { DomHandler, Parser } from 'htmlparser2';
import { Element, Node } from 'domhandler';
import { findAll } from 'domutils';
import {NodeWithChildren} from 'domhandler/lib/node'

export class PageParser {
    private static domHandler = new DomHandler();
    public static urls = new Array<string>();

    private static readonly CHECKLISTS_CLASS = 'mr mr-manual-summary';

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
        const usabilityChecklists = findAll(
            (el) => !!el.attribs.class && el.attribs.class === PageParser.CHECKLISTS_CLASS, dom
        )
        if (usabilityChecklists.length > 1) {
            throw Error("Found more than one usability declaration section in DOM");
        }
        const usabilityDeclarationNode: NodeWithChildren = usabilityChecklists[0];
        PageParser.searchChildren(usabilityDeclarationNode)
    }

    private static searchChildren(children: NodeWithChildren) {
        const ol = children.children[0] as NodeWithChildren
        const li = ol.children as Array<NodeWithChildren>
        li.forEach(node => {
            const hrefNode = (node.children.find(el => !!el['name'] && el['name'] === 'a')) as unknown as Element
            PageParser.handleHref(hrefNode)
        });
    }

    private static handleHref(hrefNode: Element) {
        PageParser.urls.push(hrefNode.attribs.href);
    }
}
