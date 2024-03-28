// Ref: https://chat.openai.com/c/07a322fd-ff60-4250-8e9c-cca0a732afce
//   I want to parse this as a Javascript AST, and rewrite the code to ensure the variable names stay consistent. Can you help me?
//   Can you make it more generic
//
// Note: This version doesn't handle variable scoping, and we can see that it causes a bug in the output when we end up with both variables named b

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

// The JavaScript code you want to modify
const code = `
(self.__BUILD_MANIFEST = (function (a, s, c, t, e, u, n, h, i, f, k) {
   return {
     __rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
     exampleVar: f,
   };
}));
`;

// Define a mapping of old variable names to new variable names
const variableMapping = {
    f: 'b',
    k: 'f'
};

// Parse the code into an AST
const ast = esprima.parseScript(code);

// Traverse and modify the AST
estraverse.traverse(ast, {
    enter: function (node) {
        // Check if the node is a FunctionExpression
        if (node.type === 'FunctionExpression') {
            // Iterate over the parameters
            for (let param of node.params) {
                // Rename the parameter if it's in the mapping
                if (variableMapping[param.name]) {
                    param.name = variableMapping[param.name];
                }
            }
        }
        // Check if the node is an Identifier (variable reference)
        if (node.type === 'Identifier') {
            // Rename the variable reference if it's in the mapping
            if (variableMapping[node.name]) {
                node.name = variableMapping[node.name];
            }
        }
    }
});

// Generate the modified JavaScript code from the AST
const modifiedCode = escodegen.generate(ast);

console.log(modifiedCode);
