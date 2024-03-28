#!/usr/bin/env node

// Ref: https://replit.com/@0xdevalias/Rewriting-JavaScript-Variables-via-AST-Examples#esprima_5_scope_extractor.js

// Ref:
//   https://chat.openai.com/c/07a322fd-ff60-4250-8e9c-cca0a732afce
//   https://chat.openai.com/c/482911c5-6dd4-4e67-8531-c17f786887d1
//
// Note: This is based off the implementation in esprima_5.js, but this version is designed to extract the variableMapping from an existing piece of code; which can then be used later to rename those mappings

// TODO: Save these scripts somewhere useful:
//   GITREF='HEAD' FILEREF='167'; git show ${GITREF}:../unpacked/_next/static/chunks/${FILEREF}.js | ./esprima_5_scope_extractor.js > variableMapping.${FILEREF}-${GITREF}.json
//   git diff --no-index --patch -- variableMapping.167-HEAD\^1.json variableMapping.167-HEAD.json

// TODO: Explore using estools/escope instead of the hacky implementations within this:
//   https://github.com/estools/escope

const readline = require('readline');

const esprima = require('esprima');
const estraverse = require('estraverse');

const {
  readAndParseVariableMappingFile,
  makeDebugLog,
  getIndentation,
  generateFunctionScopeName,
} = require('./lib/esprimaHelpers');

const DEBUG = process.env.DEBUG === 'true';

// Helper function for debug logging with indentation
const debugLog = makeDebugLog(DEBUG, { logFunc: console.log, linePrefix: '// ' });

// Check for stdin
if (process.stdin.isTTY) {
  console.error('Error: Please provide JavaScript code via stdin.');
  process.exit(1);
}

function extractVariableMapping(inputCode) {
  // Parse the code into an Abstract Syntax Tree (AST)
  const ast = esprima.parseScript(inputCode, { loc: true });

  // Create a stack to keep track of the current scope
  const scopeStack = ['global'];

  // Keep track of the count of functions by type in each scope
  const functionCountersByScope = {};

  // Extract the variableMapping from the structure of the code
  const variableMapping = {};

  // Traverse the AST
  estraverse.traverse(ast, {
    enter: (node, parent) => {
      // Track the current scope
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        const currentScope = generateFunctionScopeName(scopeStack, functionCountersByScope, node, parent);

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

      const currentScope = scopeStack[scopeStack.length - 1];

      // Extract variables to variableMapping
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

  return variableMapping;
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

    const variableMapping = extractVariableMapping(inputCode);
    // console.log(`const variableMapping = ${JSON.stringify(variableMapping, null, 2)}`);
    console.log(JSON.stringify(variableMapping, null, 2));
  });
}

main();
