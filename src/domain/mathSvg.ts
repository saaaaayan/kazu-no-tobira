import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const document = mathjax.document('', {
  InputJax: new TeX({ packages: ['base', 'ams'] }),
  OutputJax: new SVG({ fontCache: 'none' }),
});
type Drawing = { xml: string; width: number; height: number };
const cache = new Map<string, Drawing>();

export function renderMathSvg(latex: string): Drawing {
  const previous = cache.get(latex);
  if (previous) return previous;
  const svg = adaptor.firstChild(document.convert(latex, { display: true })) as ReturnType<typeof adaptor.node>;
  const xml = adaptor.outerHTML(svg);
  const [, , width, height] = adaptor.getAttribute(svg, 'viewBox').split(/\s+/).map(Number);
  if (!(width > 0 && height > 0) || xml.includes('data-mjx-error')) throw new Error('Invalid curriculum formula: ' + latex);
  const result = { xml: xml.replace(/ style="[^"]*"/, ''), width: width / 1000, height: height / 1000 };
  if (cache.size >= 512) cache.delete(cache.keys().next().value!);
  cache.set(latex, result);
  return result;
}
