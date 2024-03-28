// Ref: https://chat.openai.com/c/07a322fd-ff60-4250-8e9c-cca0a732afce
//   I want to parse this as a Javascript AST, and rewrite the code to ensure the variable names stay consistent. Can you help me?
//   Can you make it more generic
//   Will that handle variables with the same names, but in different contexts?
//
//   With additional scope fixes from: https://chat.openai.com/c/482911c5-6dd4-4e67-8531-c17f786887d1
//     Including fixes to be able to provide different mappings for different scopes
//
// Note: This version seems to work pretty well for the given example, but it has a bug where multiple anonymous functions within a given scope will end up being duplicated and/or merged together

// TODO: Explore using estools/escope instead of the hacky implementations within this:
//   https://github.com/estools/escope

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

// Set DEBUG to true to enable debug logging
const DEBUG = true;

// The JavaScript code you want to modify
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

// Define a mapping of old variable names to new variable names with scope information
const variableMapping = {
  'global.(anonymous)': {
    f: 'b',
    k: 'f'
  },
  'global.(anonymous).innerFunction': {
    f: 'x',
    k: 'y'
  }
};

// Parse the code into an Abstract Syntax Tree (AST)
const ast = esprima.parseScript(code, { loc: true });

// Create a stack to keep track of the current scope
const scopeStack = ['global'];

// Keep track of variables in each scope
const variablesInScope = {
  'global': new Set()
};

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

// Traverse the AST and replace variable names
estraverse.traverse(ast, {
  enter: (node, parent) => {
    // Track the current scope
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
      const currentScope = scopeStack[scopeStack.length - 1] + '.' + (node.id?.name || '(anonymous)');
      debugLog(`Entering new scope: ${currentScope}`, scopeStack.length);

      scopeStack.push(currentScope);
      variablesInScope[currentScope] = new Set();

      // Add function parameters to the current scope
      node.params.forEach(param => {
        if (param.type === 'Identifier') {
          variablesInScope[currentScope].add(param.name);
        }
      });

      debugLog(`Variables in scope ${currentScope}: ${[...variablesInScope[currentScope]].join(', ')}`, scopeStack.length);
    }

    // Get the current scope renames
    const currentScope = scopeStack[scopeStack.length - 1];
    const currentRenames = variableMapping[currentScope] || {};

    // Replace variable names
    if (node.type === 'Identifier' && currentRenames[node.name]) {
      debugLog(`Renaming variable ${node.name} to ${currentRenames[node.name]} in scope ${currentScope}`, scopeStack.length);
      variablesInScope[currentScope].add(currentRenames[node.name]);
      node.name = currentRenames[node.name];
    }

    // Add variables to the current scope
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
      variablesInScope[currentScope].add(node.id.name);
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

// Generate JavaScript code from the modified AST
const newCode = escodegen.generate(ast);
console.log();
console.log(newCode);
