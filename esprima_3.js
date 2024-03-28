// Ref: https://chat.openai.com/c/07a322fd-ff60-4250-8e9c-cca0a732afce
//   I want to parse this as a Javascript AST, and rewrite the code to ensure the variable names stay consistent. Can you help me?
//   Can you make it more generic
//   Will that handle variables with the same names, but in different contexts?
//
// Note: This still seems to have trouble handling the scopes properly, as can be seen with how it renames the params in innerFunction

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

// The JavaScript code you want to modify
// const code = `
// (function (a, b) {
//   var c = a + b;
//   function innerFunction(c, d) {
//     return c + d;
//   }
// })();
// `;
const code = `
(self.__BUILD_MANIFEST = (function (a, s, c, t, e, u, n, h, i, f, k) {
   function innerFunction(f, k, b, g) {
      var z = f + k + b + g;
      return z;
   }
   return {
     __rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
     exampleVar: f,
     sum: innerFunction(f, k, a, s),
   };
}));
`;

// // Define a mapping of old variable names to new variable names
// const variableMapping = {
//     c: 'x'
// };
const variableMapping = {
    f: 'b',
    k: 'f'
};

// Parse the code into an AST
const ast = esprima.parseScript(code);

// Keep a stack of scopes
const scopes = [new Map()];

// Traverse and modify the AST
estraverse.traverse(ast, {
    enter: function (node, parent) {
        // If a new function scope is entered, push a new scope to the stack
        if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
            const newScope = new Map();
            node.params.forEach(param => {
                newScope.set(param.name, true);
            });
            scopes.push(newScope);
        }

        // Check if the node is an Identifier (variable reference)
        if (node.type === 'Identifier') {
            // Check if the variable is in the current scope
            const currentScope = scopes[scopes.length - 1];
            if (currentScope.get(node.name) && variableMapping[node.name]) {
                node.name = variableMapping[node.name];
            }
        }

        // If a VariableDeclarator, add variable to the current scope
        if (node.type === 'VariableDeclarator') {
            const currentScope = scopes[scopes.length - 1];
            currentScope.set(node.id.name, true);
        }
    },
    leave: function (node) {
        // If leaving a function scope, pop the current scope from the stack
        if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
            scopes.pop();
        }
    }
});

// Generate the modified JavaScript code from the AST
const modifiedCode = escodegen.generate(ast);

console.log(modifiedCode);
