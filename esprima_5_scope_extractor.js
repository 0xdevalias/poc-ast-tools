// Ref:
//   https://chat.openai.com/c/07a322fd-ff60-4250-8e9c-cca0a732afce
//   https://chat.openai.com/c/482911c5-6dd4-4e67-8531-c17f786887d1
// 
// Note: This is based off the implementation in esprima_5.js, but this version is designed to extract the variableMapping from an existing piece of code; which can then be used later to rename those mappings
//
//  This version seems to work pretty well for the given example, but it has a bug where multiple anonymous functions within a given scope will end up being duplicated and/or merged together

// TODO: Explore using estools/escope instead of the hacky implementations within this:
//   https://github.com/estools/escope

const esprima = require('esprima');
const estraverse = require('estraverse');

// Set DEBUG to true to enable debug logging
const DEBUG = true;

// The JavaScript code you want to analyze
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

// Parse the code into an Abstract Syntax Tree (AST)
const ast = esprima.parseScript(code, { loc: true });

// Create a stack to keep track of the current scope
const scopeStack = ['global'];

// Extract the variableMapping from the structure of the code
const variableMapping = {};

// Helper function to get the indentation based on the scope depth
function getIndentation(depth) {
  return '  '.repeat(depth);
}

// Helper function for debug logging with indentation
function debugLog(message, depth) {
  if (DEBUG) {
    console.log(`${getIndentation(depth)}${message}`);
  }
}

// Traverse the AST
estraverse.traverse(ast, {
  enter: (node, parent) => {
    // Track the current scope
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
      const currentScope = scopeStack[scopeStack.length - 1] + '.' + (node.id?.name || '(anonymous)');
      debugLog(`Entering new scope: ${currentScope}`, scopeStack.length);

      scopeStack.push(currentScope);
      variableMapping[currentScope] = {};

      // Add function parameters to the current scope
      node.params.forEach(param => {
        if (param.type === 'Identifier') {
          variableMapping[currentScope][param.name] = param.name;
        }
      });

      debugLog(`Variables in scope ${currentScope}: ${Object.keys(variableMapping[currentScope]).join(', ')}`, scopeStack.length);
    }

    // Extract variables to variableMapping
    const currentScope = scopeStack[scopeStack.length - 1];
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && currentScope in variableMapping) {
      variableMapping[currentScope][node.id.name] = node.id.name;
    }
  },
  leave: (node, parent) => {
    // Leave the current scope
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
      debugLog(`Leaving scope: ${scopeStack[scopeStack.length - 1]}`, scopeStack.length - 1);
      scopeStack.pop();
    }
  }
});

// Output the variableMapping
console.log();
console.log(`const variableMapping = ${JSON.stringify(variableMapping, null, 2)}`);

// // Output the variableMapping (commented out)
// const variableMappingOutput = JSON.stringify(variableMapping, null, 2)
//   .split('\n')
//   .map((line, index) => (index === 0 ? '' : '// ') + line)
//   .join('\n');
// console.log(`// const variableMapping = ${variableMappingOutput}`);

