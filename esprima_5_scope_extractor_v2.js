// Ref:
//   https://chat.openai.com/c/07a322fd-ff60-4250-8e9c-cca0a732afce
//   https://chat.openai.com/c/482911c5-6dd4-4e67-8531-c17f786887d1
//   https://chat.openai.com/c/3501004d-5f3b-4f5b-a512-94c66df9cd56
//     Refactor to use escope
// 
// Note: This is based off the implementation in esprima_5.js, but this version is designed to extract the variableMapping from an existing piece of code; which can then be used later to rename those mappings
//
//  This version seems to work pretty well for the given example, but it has a bug where multiple anonymous functions within a given scope will end up being duplicated and/or merged together

// TODO: Explore using estools/escope instead of the hacky implementations within this:
//   https://github.com/estools/escope

const esprima = require('esprima');
const estraverse = require('estraverse');
const escope = require('escope');

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

// Parse the code into an Abstract Syntax Tree (AST)
const ast = esprima.parseScript(code, { loc: true });

// Analyze the AST with escope to get a ScopeManager
const scopeManager = escope.analyze(ast);

// Get the global scope from the ScopeManager
let currentScope = scopeManager.acquire(ast);

// Extract the variableMapping from the structure of the code
const variableMapping = {};

// Traverse the AST
estraverse.traverse(ast, {
  enter: (node, parent) => {
    // OLD CUSTOM SCOPE IMPLEMENTATION
    // // Track the current scope
    // if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
    //   const currentScope = scopeStack[scopeStack.length - 1] + '.' + (node.id?.name || '(anonymous)');
    //   debugLog(`Entering new scope: ${currentScope}`, scopeStack.length);
    // 
    //   scopeStack.push(currentScope);
    //   variableMapping[currentScope] = {};
    //
    //   // Add function parameters to the current scope
    //   node.params.forEach(param => {
    //     if (param.type === 'Identifier') {
    //       variableMapping[currentScope][param.name] = param.name;
    //     }
    //   });
    //
    //   debugLog(`Variables in scope ${currentScope}: ${Object.keys(variableMapping[currentScope]).join(', ')}`, scopeStack.length);
    // }
    //
    // // Extract variables to variableMapping
    // const currentScope = scopeStack[scopeStack.length - 1];
    // if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && currentScope in variableMapping) {
    //   variableMapping[currentScope][node.id.name] = node.id.name;
    // }

    if (/Function/.test(node.type)) {
      currentScope = scopeManager.acquire(node);  // get current function scope

      let currentScopeName = currentScope.block.id ? currentScope.block.id.name : '(anonymous)';
      let scopeIdentifier = currentScope.upper ? `${currentScope.upper.block.id ? currentScope.upper.block.id.name : '(anonymous)'}.${currentScopeName}` : 'global';

      debugLog(`Entering new scope: ${scopeIdentifier}`, currentScope.depth);

      variableMapping[scopeIdentifier] = {};

      // Add function parameters to the current scope
      currentScope.variables.forEach(variable => {
        variableMapping[scopeIdentifier][variable.name] = variable.name;
      });

      debugLog(`Variables in scope ${scopeIdentifier}: ${Object.keys(variableMapping[scopeIdentifier]).join(', ')}`, currentScope.depth);
    }
  },
  leave: (node, parent) => {
    // OLD CUSTOM SCOPE IMPLEMENTATION
    // // Leave the current scope
    // if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
    //   debugLog(`Leaving scope: ${scopeStack[scopeStack.length - 1]}`, scopeStack.length - 1);
    //   scopeStack.pop();
    // }

    if (/Function/.test(node.type)) {
      debugLog(`Leaving scope: ${currentScope.block.id ? currentScope.block.id.name : '(anonymous)'}`, currentScope.depth - 1);
      currentScope = currentScope.upper;  // set to parent scope
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

