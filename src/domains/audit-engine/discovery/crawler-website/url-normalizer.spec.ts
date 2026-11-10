import { UrlNormalizer } from './url-normalizer';
const BASE = 'https://example.com/blog/post';

describe('UrlNormalizer.filterAndNormalize', () => {
  // ---------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------
  describe('happy path', () => {
    it('normaliza um link relativo simples para URL absoluto no mesmo origin', () => {
      const result = UrlNormalizer.filterAndNormalize(['/about'], BASE);
      expect(result).toEqual(['https://example.com/about']);
    });

    it('mantém um link absoluto já no mesmo origin', () => {
      const result = UrlNormalizer.filterAndNormalize(['https://example.com/contact'], BASE);
      expect(result).toEqual(['https://example.com/contact']);
    });

    it('resolve múltiplos links relativos corretamente', () => {
      const result = UrlNormalizer.filterAndNormalize(['/a', '/b', '/c'], BASE);
      expect(result.sort()).toEqual(
        ['https://example.com/a', 'https://example.com/b', 'https://example.com/c'].sort(),
      );
    });

    it('preserva query strings', () => {
      const result = UrlNormalizer.filterAndNormalize(['/search?q=teste&page=2'], BASE);
      expect(result).toEqual(['https://example.com/search?q=teste&page=2']);
    });

    it('remove o fragmento (#hash) de um URL que também tem path/query válidos', () => {
      const result = UrlNormalizer.filterAndNormalize(['/faq?x=1#secao-2'], BASE);
      expect(result).toEqual(['https://example.com/faq?x=1']);
    });

    it('deduplica URLs iguais que só diferem no fragmento', () => {
      const result = UrlNormalizer.filterAndNormalize(
        ['/pagina#topo', '/pagina#fim', '/pagina'],
        BASE,
      );
      expect(result).toEqual(['https://example.com/pagina']);
    });

    it('resolve caminhos relativos com ./ e ../', () => {
      const result = UrlNormalizer.filterAndNormalize(['../other-post', './sibling'], BASE);
      expect(result.sort()).toEqual(
        ['https://example.com/other-post', 'https://example.com/blog/sibling'].sort(),
      );
    });

    it('devolve array vazio quando a lista de hrefs está vazia', () => {
      expect(UrlNormalizer.filterAndNormalize([], BASE)).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------
  // Filtragem de esquemas não-http (mailto, tel, javascript, #)
  // ---------------------------------------------------------------------
  describe('filtragem de esquemas ignorados', () => {
    it('ignora links mailto:', () => {
      expect(UrlNormalizer.filterAndNormalize(['mailto:foo@example.com'], BASE)).toEqual([]);
    });

    it('ignora links tel:', () => {
      expect(UrlNormalizer.filterAndNormalize(['tel:+351911234567'], BASE)).toEqual([]);
    });

    it('ignora links javascript:', () => {
      expect(UrlNormalizer.filterAndNormalize(['javascript:void(0)'], BASE)).toEqual([]);
    });

    it('ignora links que são apenas âncoras (#...)', () => {
      expect(UrlNormalizer.filterAndNormalize(['#section1'], BASE)).toEqual([]);
      expect(UrlNormalizer.filterAndNormalize(['#'], BASE)).toEqual([]);
    });

    it('ignora esquemas independentemente de maiúsculas/minúsculas', () => {
      expect(
        UrlNormalizer.filterAndNormalize(
          ['MAILTO:foo@example.com', 'TEL:123', 'JavaScript:doSomething()'],
          BASE,
        ),
      ).toEqual([]);
    });

    it('ignora esquemas mesmo com espaços em branco antes/depois', () => {
      expect(UrlNormalizer.filterAndNormalize(['   mailto:foo@example.com   '], BASE)).toEqual([]);
    });

    it("não ignora um URL cujo path apenas contém a substring 'mailto:' fora do início", () => {
      // O regex é ancorado ao início (^), então isto deve passar normalmente.
      const result = UrlNormalizer.filterAndNormalize(
        ['/redirect?to=mailto:foo@example.com'],
        BASE,
      );
      expect(result).toEqual(['https://example.com/redirect?to=mailto:foo@example.com']);
    });
  });

  // ---------------------------------------------------------------------
  // Valores falsy / inválidos na lista
  // ---------------------------------------------------------------------
  describe('valores falsy e inválidos', () => {
    it('ignora strings vazias, null e undefined dentro do array', () => {
      const input = ['', null, undefined, '/valid'] as unknown as string[];
      const result = UrlNormalizer.filterAndNormalize(input, BASE);
      expect(result).toEqual(['https://example.com/valid']);
    });

    it('uma string apenas com espaços em branco resolve para o próprio baseUrl (sem hash)', () => {
      // trim() -> "", new URL("", baseUrl) resolve para o baseUrl.
      const result = UrlNormalizer.filterAndNormalize(['   '], BASE);
      expect(result).toEqual([BASE]);
    });

    it('ignora URLs completamente inválidos (não resolvem nem como relativos)', () => {
      const result = UrlNormalizer.filterAndNormalize(
        ['http://[::1', 'https://', 'https://example.com:invalid-port'],
        BASE,
      );
      expect(result).toEqual([]);
    });
    it('ignora silenciosamente e continua a processar os hrefs seguintes após um inválido', () => {
      const result = UrlNormalizer.filterAndNormalize(['http://[::1', '/valid-after-error'], BASE);
      expect(result).toEqual(['https://example.com/valid-after-error']);
    });
  });

  // ---------------------------------------------------------------------
  // Verificação de origin (mesmo domínio, protocolo, porta)
  // ---------------------------------------------------------------------
  describe('verificação de origin', () => {
    it('ignora um URL com domínio diferente', () => {
      expect(UrlNormalizer.filterAndNormalize(['https://other.com/page'], BASE)).toEqual([]);
    });

    it('ignora um URL com subdomínio diferente (www vs sem www)', () => {
      expect(UrlNormalizer.filterAndNormalize(['https://www.example.com/page'], BASE)).toEqual([]);
    });

    it('ignora um URL com protocolo diferente (http vs https)', () => {
      expect(UrlNormalizer.filterAndNormalize(['http://example.com/page'], BASE)).toEqual([]);
    });

    it('ignora um URL com porta diferente', () => {
      expect(UrlNormalizer.filterAndNormalize(['https://example.com:8443/page'], BASE)).toEqual([]);
    });

    it('aceita um URL cuja porta coincide explicitamente com a porta default do baseUrl', () => {
      const result = UrlNormalizer.filterAndNormalize(['https://example.com:443/page'], BASE);
      expect(result).toEqual(['https://example.com/page']);
    });

    it('trata protocolo e host como case-insensitive na comparação de origin', () => {
      const result = UrlNormalizer.filterAndNormalize(['HTTPS://EXAMPLE.COM/Page'], BASE);
      // O host é normalizado para minúsculas pela classe URL; o path mantém a capitalização.
      expect(result).toEqual(['https://example.com/Page']);
    });

    it('ignora um URL relativo a protocolo (//host/path) quando o host é diferente', () => {
      expect(UrlNormalizer.filterAndNormalize(['//other.com/page'], BASE)).toEqual([]);
    });

    it('aceita um URL relativo a protocolo (//host/path) quando o host é igual', () => {
      const result = UrlNormalizer.filterAndNormalize(['//example.com/page'], BASE);
      expect(result).toEqual(['https://example.com/page']);
    });
  });

  // ---------------------------------------------------------------------
  // Extensões ignoradas
  // ---------------------------------------------------------------------
  describe('extensões ignoradas', () => {
    it.each([
      'css',
      'jpg',
      'jpeg',
      'gif',
      'svg',
      'pdf',
      'docx',
      'js',
      'png',
      'ico',
      'xml',
      'mp4',
      'mp3',
      'mkv',
      'wav',
      'rss',
      'json',
      'pptx',
      'txt',
      'zip',
    ])('ignora ficheiros com extensão .%s', (ext) => {
      const result = UrlNormalizer.filterAndNormalize([`/assets/file.${ext}`], BASE);
      expect(result).toEqual([]);
    });

    it('ignora extensões independentemente de maiúsculas/minúsculas', () => {
      const result = UrlNormalizer.filterAndNormalize(
        ['/image.PNG', '/style.CSS', '/doc.PDF'],
        BASE,
      );
      expect(result).toEqual([]);
    });

    it('aceita paths sem extensão', () => {
      const result = UrlNormalizer.filterAndNormalize(['/about-us'], BASE);
      expect(result).toEqual(['https://example.com/about-us']);
    });

    it('aceita paths com extensão não listada (ex: .html)', () => {
      const result = UrlNormalizer.filterAndNormalize(['/index.html'], BASE);
      expect(result).toEqual(['https://example.com/index.html']);
    });

    it('não confunde uma extensão ignorada que aparece no meio do path (sem ser sufixo)', () => {
      // "/css/page" não termina em ".css", por isso deve ser aceite.
      const result = UrlNormalizer.filterAndNormalize(['/css/page'], BASE);
      expect(result).toEqual(['https://example.com/css/page']);
    });

    it('não confunde um path que termina apenas com o nome da extensão sem ponto', () => {
      // "/pagecss" não tem o ponto antes de "css", por isso não deve ser filtrado.
      const result = UrlNormalizer.filterAndNormalize(['/pagecss'], BASE);
      expect(result).toEqual(['https://example.com/pagecss']);
    });

    it('filtra corretamente quando o nome do ficheiro tem múltiplos pontos (ex: arquivo.min.js)', () => {
      const result = UrlNormalizer.filterAndNormalize(['/scripts/app.min.js'], BASE);
      expect(result).toEqual([]);
    });

    it('não filtra quando a extensão ignorada aparece antes da extensão final (ex: notas.pdf.txt)', () => {
      // Termina em .txt, que também está na lista de extensões ignoradas -> deve ser filtrado.
      const result = UrlNormalizer.filterAndNormalize(['/notas.pdf.txt'], BASE);
      expect(result).toEqual([]);
    });

    it('aplica o filtro de extensão com base no pathname, ignorando a query string', () => {
      // pathname é "/file.pdf", extensão ignorada, mesmo com query string diferente.
      const result = UrlNormalizer.filterAndNormalize(['/file.pdf?download=true'], BASE);
      expect(result).toEqual([]);
    });

    it('não é enganado por uma extensão ignorada presente apenas na query string', () => {
      // pathname termina em ".html", a query contém "file=doc.pdf" mas isso é irrelevante.
      const result = UrlNormalizer.filterAndNormalize(['/download.html?file=doc.pdf'], BASE);
      expect(result).toEqual(['https://example.com/download.html?file=doc.pdf']);
    });
  });

  // ---------------------------------------------------------------------
  // Deduplicação
  // ---------------------------------------------------------------------
  describe('deduplicação', () => {
    it('remove duplicados exatos', () => {
      const result = UrlNormalizer.filterAndNormalize(['/page', '/page', '/page'], BASE);
      expect(result).toEqual(['https://example.com/page']);
    });

    it('trata URLs com trailing slash diferente como entradas distintas', () => {
      const result = UrlNormalizer.filterAndNormalize(['/page', '/page/'], BASE);
      expect(result.sort()).toEqual(
        ['https://example.com/page', 'https://example.com/page/'].sort(),
      );
    });

    it('trata a mesma URL alcançada por caminhos relativos diferentes como duplicada após resolução', () => {
      const result = UrlNormalizer.filterAndNormalize(['/blog/other', '../blog/other'], BASE);
      expect(result).toEqual(['https://example.com/blog/other']);
    });
  });

  // ---------------------------------------------------------------------
  // baseUrl inválido
  // ---------------------------------------------------------------------
  describe('baseUrl inválido', () => {
    it('devolve array vazio (via catch) quando o baseUrl é inválido, mesmo com hrefs absolutos válidos', () => {
      const result = UrlNormalizer.filterAndNormalize(
        ['https://example.com/page'],
        'not-a-valid-base-url',
      );
      expect(result).toEqual([]);
    });

    it('devolve array vazio quando o baseUrl é uma string vazia', () => {
      const result = UrlNormalizer.filterAndNormalize(['/page'], '');
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------
  // Espaços em branco / trimming
  // ---------------------------------------------------------------------
  describe('trimming de espaços em branco', () => {
    it('remove espaços em branco à volta do href antes de processar', () => {
      const result = UrlNormalizer.filterAndNormalize(['   /trimmed   '], BASE);
      expect(result).toEqual(['https://example.com/trimmed']);
    });

    it('remove espaços em branco antes de detectar esquemas ignorados', () => {
      expect(UrlNormalizer.filterAndNormalize(['\n\t #ancora \t\n'], BASE)).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------
  // Casos combinados / regressão
  // ---------------------------------------------------------------------
  describe('cenários combinados', () => {
    it('processa uma lista mista de hrefs válidos e inválidos, devolvendo apenas os válidos e normalizados', () => {
      const input = [
        '/valid-page',
        'mailto:test@example.com',
        '#top',
        'https://external.com/page',
        '/image.jpg',
        '',
        null,
        'javascript:alert(1)',
        '/valid-page#dup',
        'tel:123456',
        '/docs/report.pdf',
        '/another-valid?x=1',
      ] as unknown as string[];

      const result = UrlNormalizer.filterAndNormalize(input, BASE);

      expect(result.sort()).toEqual(
        ['https://example.com/valid-page', 'https://example.com/another-valid?x=1'].sort(),
      );
    });

    it('não modifica o array de entrada original', () => {
      const input = ['/a', '/b'];
      const inputCopy = [...input];
      UrlNormalizer.filterAndNormalize(input, BASE);
      expect(input).toEqual(inputCopy);
    });

    it('devolve sempre um novo array (não a mesma referência entre chamadas)', () => {
      const result1 = UrlNormalizer.filterAndNormalize(['/a'], BASE);
      const result2 = UrlNormalizer.filterAndNormalize(['/a'], BASE);
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });
});
