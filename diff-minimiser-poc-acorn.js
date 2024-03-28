#!/usr/bin/env node

// https://github.com/eslint/espree
//   https://github.com/eslint/espree#tokenize
// https://github.com/acornjs/acorn
//   https://github.com/acornjs/acorn/tree/master/acorn-loose/
// https://github.com/estools/escodegen

const { parseArgs } = require('util');
const path = require('path');
const { readFileSync, existsSync } = require('fs');
const { createInterface } = require('readline');
const { once } = require('events');

// const parseDiff = require('parse-diff');
// const { diffChars, diffWords, diffLines, diffArrays } = require('diff');

const acorn = require('acorn');
const acornLoose = require('acorn-loose');
const estraverse = require('estraverse');
const escodegen = require('escodegen');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

let DEBUG = false; // Initial debug state

/**
 * Displays usage information for the script.
 *
 * @param {string} scriptName - The name of the script for which to display usage information.
 */
function displayUsage(scriptName) {
  console.log(`Usage: ${scriptName} <file-path>
Options:
  --debug        Enable debug mode.
  -h, --help     Display this usage information.`);
}

/**
 * Parses command line arguments, reads the specified file, and returns its content.
 * Exits the process on argument errors or file read errors.
 *
 * @returns {Object} An object containing:
 *                   - code: The source code read from the file.
 */
async function parseArgsAndReadInput() {
  const scriptName = path.basename(process.argv[1]);

  const parsedArgs = (() => {
    try {
      return parseArgs({
        strict: true,
        allowPositionals: false,
        options: {
          debug: {
            type: 'boolean',
            default: false,
          },
          help: {
            type: 'boolean',
            short: 'h',
          },
          file: {
            type: 'string',
            short: 'f',
          },
        },
      });
    } catch (error) {
      displayUsage(scriptName);
      console.error('\nError: Invalid arguments provided.', error.message);
      process.exit(1);
    }
  })();

  if (parsedArgs.values.help) {
    displayUsage(scriptName);
    process.exit(0);
  }

  DEBUG = parsedArgs.values.debug || false;
  const filePath = parsedArgs.values.file;

  const hasStdin = !process.stdin.isTTY;

  if (filePath && filePath !== '-' && hasStdin) {
    console.error(
      `Error: Both file path and stdin were provided. Please provide only one.`
    );
    process.exit(1);
  }

  if (filePath === '-' && !hasStdin) {
    console.error(
      `Error: File path is set to read from stdin, but no stdin input was provided.`
    );
    process.exit(1);
  }

  if (!hasStdin && !existsSync(filePath)) {
    console.error(`Error: File does not exist at path ${filePath}`);
    process.exit(1);
  }

  const rawDiffText = hasStdin
    ? (await readAllStdin()).join('\n')
    : readFileSync(filePath, 'utf8');

  return {
    scriptName,
    filePath,
    rawDiffText,
  };
}

async function readAllStdin() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
    crlfDelay: Infinity,
  });

  const lines = [];
  rl.on('line', (line) => lines.push(line));
  await once(rl, 'close');

  return lines;
}

/**
 * Main entry point of the script. Parses input, analyzes data, and outputs results.
 */
async function main() {
  const code =
    '                  (eM = "\\x1b[31m"))\n' +
    '                : ((ej = ""), (eO = ""), (eA = ""), (eM = ""))),';

  // const tokens = espree.tokenize('let foo = "bar"', { ecmaVersion: 6 });
  // console.log(tokens);

  const acornTokenizer = acorn.tokenizer(code, { ecmaVersion: 2020 });
  const acornTokens = Array.from(acornTokenizer);
  console.log('acornLooseTokens', acornTokens);
  console.log(
    'acornLooseTokens2',
    acornTokens.map((t) => t.value || t.type.label)
  );

  const ast = acornLoose.parse(code, { ecmaVersion: 2020 });

  console.log('acornLoose AST', ast);

  const acornLooseGeneratedCode = escodegen.generate(ast);

  console.log(
    'acornLoose AST acornLooseGeneratedCode:\n',
    acornLooseGeneratedCode
  );

  const filteredAst = filterAcornLooseAST(ast);
  const acornLooseFilteredGeneratedCode = escodegen.generate(filteredAst);

  console.log(
    'acornLoose AST acornLooseFilteredGeneratedCode:\n',
    acornLooseFilteredGeneratedCode
  );

  const babelAst = parseCodeToAST(acornLooseFilteredGeneratedCode);

  console.log('babel AST', babelAst);
  console.log('babel AST2', babelAst.program.body);

  const { code: babelGeneratedCode } = generator(
    babelAst,
    {},
    acornLooseFilteredGeneratedCode
  );

  console.log('babel AST babelGeneratedCode:\n', babelGeneratedCode);
}

// async function prepareCodeForASTParsingV2(code) {
//   // Parse the code into an AST using acornLoose's error tolerant parser
//   const ast = acornLoose.parse(code, { ecmaVersion: 2020 });
//
//   // Filter the AST to remove acornLoose's dummy nodes
//   const filteredAst = estraverse.replace(ast, {
//     enter: (node, parent) => {
//       if (acornLoose.isDummy(node)) {
//         return estraverse.VisitorOption.Remove;
//       }
//     },
//   });
//
//   const preparedCode = escodegen.generate(filteredAst);
//
//   return {
//     ast,
//     filteredAst,
//     preparedCode,
//   };
// }

// https://github.com/acornjs/acorn/tree/master/acorn-loose/#interface
// https://github.com/estools/estraverse/wiki/Usage
const filterAcornLooseAST = (ast) => {
  return estraverse.replace(ast, {
    enter: (node, parent) => {
      if (acornLoose.isDummy(node)) {
        console.log('dummy', node);
        console.log('dummy parent', parent);
        return estraverse.VisitorOption.Remove;
      }
    },
  });
};

/**
 * Parses the provided code into an Abstract Syntax Tree (AST).
 *
 * @param {string} code - The code to parse.
 * @returns {Object} The parsed AST.
 *
 * @see https://babeljs.io/docs/babel-parser#options
 */
function parseCodeToAST(code) {
  const ast = parser.parse(code, {
    sourceType: 'module',
    errorRecovery: true,
  });

  return ast;
}

/**
 * Normalizes the specified code to stabilize symbol names.
 *
 * @param {string} code - The source code to normalize.
 * @param {object} errorContext - The context in which the error occurred.
 * @returns {string} The normalized source code.
 */
function normalizeIdentifierNamesInCode(code, errorContext = {}) {
  // const preparedCode = prepareCodeForASTParsing(code);
  const preparedCode = code;

  try {
    const ast = parseCodeToAST(preparedCode);

    let identifierCounter = 1;
    const identifierMap = new Map();

    traverse(ast, {
      Identifier(path) {
        if (!identifierMap.has(path.node.name)) {
          identifierMap.set(path.node.name, `symbol${identifierCounter++}`);
        }
        path.node.name = identifierMap.get(path.node.name);
      },
    });

    // https://babeljs.io/docs/babel-generator#options
    const { code: generatedCode } = generator(ast, {}, code);

    return generatedCode;
  } catch (err) {
    console.warn(
      '[diff::normalizeIdentifierNamesInCode] error while trying to parse code into AST, continuing with un-normalised code',
      {
        err,
        errorContext,
        code,
        preparedCode,
      }
    );
    return code;
  }
}

/**
 * Extract unique identifiers from the specified code.
 *
 * @param {string} code - The source code from which to extract identifiers.
 * @returns {Set<string>} A set of unique identifiers extracted from the code.
 *
 * @TODO currently we're not really using this.. is it worth keeping/using somehow?
 */
function extractIdentifiersFromCode(code) {
  const ast = parseCodeToAST(code);

  const identifiers = new Set();

  traverse(ast, {
    Identifier(path) {
      identifiers.add(path.node.name);
    },
  });

  return identifiers;
}

// Entry point
main().catch((err) => {
  console.error('error:', err);
});
