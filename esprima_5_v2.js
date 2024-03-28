#!/usr/bin/env node

// -------------------------------------------------------------------------------------------------
// TODO: The variable scope parsing/rewriting is pretty horribly broken in this currently I think..
// it might be easier to try and write it in something other than esprima...
// -------------------------------------------------------------------------------------------------

// Ref: https://replit.com/@0xdevalias/Rewriting-JavaScript-Variables-via-AST-Examples#esprima_5.js

// Ref: https://chat.openai.com/c/07a322fd-ff60-4250-8e9c-cca0a732afce
//   I want to parse this as a Javascript AST, and rewrite the code to ensure the variable names stay consistent. Can you help me?
//   Can you make it more generic
//   Will that handle variables with the same names, but in different contexts?
//
//   With additional scope fixes from: https://chat.openai.com/c/482911c5-6dd4-4e67-8531-c17f786887d1
//     Including fixes to be able to provide different mappings for different scopes
//
// Note: This version seems to work pretty well for the given example

// TODO: Explore using estools/escope instead of the hacky implementations within this:
//   https://github.com/estools/escope

const readline = require('readline');

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

const {
  readAndParseVariableMappingFile,
  makeDebugLog,
  getIndentation,
  generateFunctionScopeName,
} = require('./lib/esprimaHelpers');

const DEBUG = process.env.DEBUG === 'true';

// Helper function for debug logging with indentation
const debugLog = makeDebugLog(DEBUG);

// Check for stdin
if (process.stdin.isTTY) {
  console.error('Error: Please provide JavaScript code via stdin.');
  process.exit(1);
}

// Read variableMapping from a JSON file specified as a CLI argument
if (process.argv.length < 3) {
  console.error('Error: Please specify the path to the variableMapping JSON file as a command line argument.');
  process.exit(1);
}

// Read and parse the variable mapping JSON file from the provided file path
const variableMappingFilePath = process.argv[2];
const variableMapping = readAndParseVariableMappingFile(variableMappingFilePath);
if (!variableMapping) {
  process.exit(1);
}

// const variableMapping = {
//   'global.(anonymous)': {
//     f: 'b',
//     k: 'f'
//   },
//   'global.(anonymous).innerFunction': {
//     f: 'x',
//     k: 'y'
//   }
// };

function renameVariablesInCode(inputCode) {
  // Parse the code into an Abstract Syntax Tree (AST)
  const ast = esprima.parseScript(inputCode, { loc: true });

  // Create a stack to keep track of the current scope
  const scopeStack = ['global'];

  // Keep track of the count of functions by type in each scope
  const functionCountersByScope = {};

  const variablesInScope = {
    'global': new Set()
  };

  estraverse.traverse(ast, {
    enter: (node, parent) => {
      // Track the current scope
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        const currentScope = generateFunctionScopeName(scopeStack, functionCountersByScope, node, parent);

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

      const currentScope = scopeStack[scopeStack.length - 1];

      // Rename identifier based on variableMapping
      // Note: we use Object.create(null) and to avoid a weird case we ran into:
      //   "Renaming variable toString to function toString() { [native code] } in scope global.86433.f.(argfn->r._->1).(argfn->s.Jh->1)"
      const currentRenames = variableMapping[currentScope] || Object.create(null);
      if (node.type === 'Identifier' && currentRenames[node.name]) {
        debugLog(`Renaming variable ${node.name} to ${currentRenames[node.name]} in scope ${currentScope}`, scopeStack.length);
        variablesInScope[currentScope].add(currentRenames[node.name]);
        node.name = currentRenames[node.name];
      }

      if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
        variablesInScope[currentScope].add(node.id.name);
      }
    },
    leave: (node, parent) => {
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        debugLog(`Leaving scope: ${scopeStack[scopeStack.length - 1]}`, scopeStack.length - 1);
        scopeStack.pop();
      }
    }
  });

  return escodegen.generate(ast);
}

function main() {
  let inputCode = '';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    inputCode += line + '\n';
  });

  rl.on('close', () => {
    if (!inputCode.trim()) {
      console.error('Error: STDIN was empty');
      process.exit(1);
    }

    const outputCode = renameVariablesInCode(inputCode);
    console.log(outputCode);
  });
}

main();
