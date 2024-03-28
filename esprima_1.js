// Ref: https://chat.openai.com/c/07a322fd-ff60-4250-8e9c-cca0a732afce
//   I want to parse this as a Javascript AST, and rewrite the code to ensure the variable names stay consistent. Can you help me?
//
//   Note: This version isn't very generic

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

// The JavaScript code you want to modify
const code = `
(self.__BUILD_MANIFEST = (function (a, s, c, t, e, u, n, h, i, f, k) {
   return {
     __rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
   };
}));
`;

// Parse the code into an AST
const ast = esprima.parseScript(code);

// Traverse and modify the AST
estraverse.traverse(ast, {
    enter: function (node) {
        // Check if the node is a FunctionExpression
        if (node.type === 'FunctionExpression') {
            // Change the last two parameter names
            const params = node.params;
            if (params.length >= 2) {
                params[params.length - 2].name = 'b';
                params[params.length - 1].name = 'f';
            }
        }
    }
});

// Generate the modified JavaScript code from the AST
const modifiedCode = escodegen.generate(ast);

console.log(modifiedCode);
