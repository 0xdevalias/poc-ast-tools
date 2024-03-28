// Ref: https://chat.openai.com/c/07a322fd-ff60-4250-8e9c-cca0a732afce
//   I want to parse this as a Javascript AST, and rewrite the code to ensure the variable names stay consistent. Can you help me?
//   Can you make it more generic
//   Will that handle variables with the same names, but in different contexts?
//
//   With additional scope fixes from: https://chat.openai.com/c/482911c5-6dd4-4e67-8531-c17f786887d1
//
// Note: This won't allow us to provide different variableMapping's for different scopes

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

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

const variableMapping = {
    f: 'b',
    k: 'f'
};

const ast = esprima.parseScript(code, { loc: true });

const scopes = [new Map()];

estraverse.traverse(ast, {
    enter: function (node, parent) {
        const currentScope = scopes[scopes.length - 1];

        if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
            const newScope = new Map();
            const paramNames = new Set();
            
            // Determine the scope name or description for the warning message
            let scopeName = "an anonymous function";
            if (node.type === 'FunctionDeclaration' && node.id && node.id.name) {
                scopeName = `function ${node.id.name}`;
            }

            node.params.forEach(param => {
                const oldName = param.name;
                const newName = variableMapping[oldName] || oldName;
                if (paramNames.has(newName)) {
                    // Include the scope information in the warning message
                    console.warn(`Warning: Duplicate parameter name "${newName}" in ${scopeName} at line ${node.loc.start.line}`);
                }
                paramNames.add(newName);
                newScope.set(oldName, newName);
                param.name = newName;
            });
            scopes.push(newScope);
        }

        if (node.type === 'Identifier' && parent.type !== 'FunctionDeclaration' && parent.type !== 'FunctionExpression') {
            const originalName = node.name;
            let newName = originalName;
            for (let i = scopes.length - 1; i >= 0; i--) {
                if (scopes[i].has(originalName)) {
                    newName = scopes[i].get(originalName);
                    break;
                }
            }
            if (variableMapping[originalName]) {
                newName = variableMapping[originalName];
            }
            node.name = newName;
        }
    },
    leave: function (node) {
        if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
            scopes.pop();
        }
    }
});

const modifiedCode = escodegen.generate(ast);

console.log('');
console.log(modifiedCode);
