const jscodeshift = require('jscodeshift').withParser('babylon');

const sourceCode = `
function m() {
  var e = (0, r._)(["foo", "bar"]);
  return (
    (m = function () {
      return e;
    }),
    e
  );
}

function p() {
  var e = (0, r._)(["foo", "bar", "baz"]);
  return (
    (p = function () {
      return e;
    }),
    e
  );
}

var b = x.y.div(
  m(),
  function (e) {
    return e.$isMessageRedesign
      ? "rounded-full h-7 w-7"
      : "rounded-sm h-[30px] w-[30px]";
  });
  
var y = x.y.span(
    p(),
    function (e) { return "warning" === e.$type && "bg-orange-500 text-white"; },
    function (e) { return "danger" === e.$type && "bg-red-500 text-white"; }
  );

const x0 = div("foo", (e) => "bar")
const x1 = a1.div("foo", (e) => "bar")
const x2 = a1.b1.div("foo", (e) => "bar")
const x3 = a1.b1.c1.div("foo", (e) => "bar")

const y0 = notAnElement("foo", (e) => "bar")
const y1 = a1.notAnElement("foo", (e) => "bar")
const y2 = a1.b1.notAnElement("foo", (e) => "bar")
const y3 = a1.b1.c1.notAnElement("foo", (e) => "bar")
`;

const domElements = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'big',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'menuitem',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'track',
  'u',
  'ul',
  'use',
  'var',
  'video',
  'wbr', // SVG
  'circle',
  'clipPath',
  'defs',
  'ellipse',
  'foreignObject',
  'g',
  'image',
  'line',
  'linearGradient',
  'marker',
  'mask',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'stop',
  'svg',
  'text',
  'tspan',
];

const ast = jscodeshift(sourceCode);

ast.find(jscodeshift.CallExpression)
.forEach(path => {
  // Check if the callee is a MemberExpression
  if (path.value.callee.type === 'MemberExpression') {
    const memberExp = path.value.callee;

    // Check if the object of the MemberExpression is also a MemberExpression
    if (memberExp.object.type === 'MemberExpression') {
      const innerMemberExp = memberExp.object;

      // Ensure that the object of the inner MemberExpression is not another MemberExpression
      if (innerMemberExp.object.type !== 'MemberExpression' &&
          domElements.includes(memberExp.property.name)) {
        console.log(`Found styled-components'ish pattern ${innerMemberExp.object.name}.${innerMemberExp.property.name}.${memberExp.property.name}()`);

        // Transform CallExpression to TaggedTemplateExpression
        const args = path.value.arguments;

        // The first item in quasis is the static text before the first expression, the first item in expressions is the first dynamic expression, the second item in quasis is the static text after the first expression and before the second expression, and so on.
        const expressions = [];
        const quasis = [];
        
        args.forEach((arg, index) => {
          let value;

          const isFirst = index === 0;
          const isLast = index === args.length - 1;

          const prefix = isFirst ? '\n  ' : '\n  '
          const suffix = isLast ? '\n' : '\n  '
          
          if (arg.type === 'StringLiteral') {
            // Directly include string literals in the template
            value = { raw: `${prefix}${arg.value}${suffix}`, cooked: `${prefix}${arg.value}${suffix}` };
            quasis.push(jscodeshift.templateElement(value, false));
          } else {
            if (isFirst) {
              value = { raw: prefix, cooked: prefix };
              quasis.push(jscodeshift.templateElement(value, isLast));
            }

            value = { raw: suffix, cooked: suffix };
            quasis.push(jscodeshift.templateElement(value, isLast));
            
            // For non-string expressions, place them in ${}
            expressions.push(arg);
          }
        });
        
        const taggedTemplateExp = jscodeshift.taggedTemplateExpression(
          memberExp,
          jscodeshift.templateLiteral(quasis, expressions)
        );

        // Replace the original CallExpression with the new TaggedTemplateExpression
        jscodeshift(path).replaceWith(taggedTemplateExp);
      }
    }
  }
});

const newSourceCode = ast.toSource();
console.log("---");
console.log("Rewritten code:");
console.log(newSourceCode);
