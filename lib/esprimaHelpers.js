const fs = require('fs');

const json5 = require('json5');

function readAndParseVariableMappingFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Check if the file is empty
    if (!fileContent.trim()) {
      console.error('Error: The JSON file is empty.');
      return null;
    }

    // Attempt to parse the file content
    try {
      const parsedContent = json5.parse(fileContent);

      // Check if the parsed content is an object and not an array
      if (typeof parsedContent !== 'object' || Array.isArray(parsedContent)) {
        console.error('Error: The JSON file should contain an object.');
        return null;
      }

      // Check if the parsed object is empty
      if (Object.keys(parsedContent).length === 0) {
        console.error('Error: The JSON file produced an empty object.');
        return null;
      }

      return parsedContent;
    } catch (parseError) {
      console.error('Error parsing the JSON file:', parseError);
      return null;
    }
  } catch (readError) {
    console.error('Error reading the JSON file:', readError);
    return null;
  }
}

// Helper function for debug logging with indentation
const makeDebugLog = (DEBUG, { logFunc = console.error, linePrefix = '' } = {}) => function debugLog(message, depth) {
  if (DEBUG) {
    logFunc(`${linePrefix}${getIndentation(depth)}${message}`);
  }
}

// Helper function to get the indentation based on the scope depth
function getIndentation(depth) {
  return '  '.repeat(depth);
}

function getChainedFunctionName(callee) {
  if (callee.type === 'MemberExpression' && callee.object && callee.property) {
    const objectName = getChainedFunctionName(callee.object);
    const propertyName = callee.property.name || '';
    return objectName ? `${objectName}.${propertyName}` : propertyName;
  }

  if (callee.type === 'CallExpression' && callee.callee) {
    return getChainedFunctionName(callee.callee);
  }

  if (callee.type === 'Identifier') {
    return callee.name;
  }

  return '';
}

function getFunctionCounter(functionCountersByScope, currentScope, counterKey) {
  functionCountersByScope[currentScope] = functionCountersByScope[currentScope] || {};
  functionCountersByScope[currentScope][counterKey] = (functionCountersByScope[currentScope][counterKey] || 0) + 1;
  return functionCountersByScope[currentScope][counterKey];
}

function generateFunctionScopeName(
  scopeStack,
  functionCountersByScope,
  node,
  parent
) {
  const currentScope = scopeStack[scopeStack.length - 1];
  let functionName;

  if (node.id) {
    // Named function
    functionName = node.id.name;
  } else if (parent && parent.type === "Property" && parent.key) {
    // Function within an object, use the key as the name
    functionName =
      parent.key.type === "Identifier"
        ? parent.key.name
        : String(parent.key.value);
  } else if (
    parent &&
    parent.type === "CallExpression" &&
    parent.callee &&
    parent.callee.property
  ) {
    // Function used as a callback (like in .then() or .catch())
    const chainedFunctionName = getChainedFunctionName(parent.callee);

    const counterKey = chainedFunctionName || parent.callee.property.name;

    const callbackCounter = getFunctionCounter(
      functionCountersByScope,
      currentScope,
      counterKey
    );

    // functionName = `(${counterKey}_callback_${callbackCounter})`;
    functionName = `(callback->${counterKey}->${callbackCounter})`;
  } else if (
    parent &&
    parent.type === "CallExpression" &&
    parent.callee &&
    parent.callee.type === "SequenceExpression" &&
    parent.callee.expressions
  ) {
    // TODO: if there is an ExpressionStatement somewhere in the parents of this, can/should we also add that variable name to the scope?

    const memberExpression = parent.callee.expressions.find(expr => expr.type === 'MemberExpression');

    // const calleeName = memberExpression ? `${memberExpression.property.name}` : 'unknown';
    const calleeName = memberExpression ? `${memberExpression.object.name}.${memberExpression.property.name}` : 'unknown';

    const callbackCounter = getFunctionCounter(
      functionCountersByScope,
      currentScope,
      calleeName
    );

    // functionName = `(${calleeName}_argfn_${callbackCounter})`;
    // functionName = `(argfn::${calleeName}::${callbackCounter})`;
    functionName = `(argfn->${calleeName}->${callbackCounter})`;
  // } else if (
  //   parent &&
  //   parent.type === "SequenceExpression" &&
  //   parent.parent &&
  //   parent.parent.type === "CallExpression" &&
  //   parent.parent.callee &&
  //   parent.parent.callee.type == "SequenceExpression" &&
  //   parent.parent.callee.expressions
  // ) {
  //   // TODO: estraverse doesn't support getting the parent of a parent; we need to save it ourself, or use a different AST library:
  //   //   https://github.com/estools/estraverse/issues/55#issuecomment-262747876

  //   // TODO: this is basically a variation of the above that is nested 2 levels deep.. can we genericise it to handle any level of nesting properly?

  //   // TODO: if there is an ExpressionStatement somewhere in the parents of this, can/should we also add that variable name to the scope?

  //   const memberExpression = parent.parent.callee.expressions.find(expr => expr.type === 'MemberExpression');

  //   // // const calleeName = memberExpression ? `${memberExpression.property.name}` : 'unknown';
  //   const calleeName = memberExpression ? `${memberExpression.object.name}.${memberExpression.property.name}` : 'unknown';

  //   const callbackCounter = getFunctionCounter(
  //     functionCountersByScope,
  //     currentScope,
  //     calleeName
  //   );

  //   functionName = `(argfn{nested}->${calleeName}->${callbackCounter})`;
  } else {
    // Anonymous function
    const anonymousFunctionCounter = getFunctionCounter(
      functionCountersByScope,
      currentScope,
      "anonymous"
    );
    functionName = `(anonymous_${anonymousFunctionCounter})`;
  }

  return `${currentScope}.${functionName}`;
}

module.exports = {
  readAndParseVariableMappingFile,
  makeDebugLog,
  getIndentation,
  getChainedFunctionName,
  getFunctionCounter,
  generateFunctionScopeName,
}

// LEGACY

// // Helper function to generate function scope name
// function generateFunctionScopeName(scopeStack, anonymousFunctionCounters, node) {
//   const currentScope = scopeStack[scopeStack.length - 1];
//   let functionName;
//
//   if (node.id) {
//     // Named function
//     functionName = node.id.name;
//   } else {
//     // Anonymous function
//     anonymousFunctionCounters[currentScope] = (anonymousFunctionCounters[currentScope] || 0) + 1;
//     const anonymousFunctionCounter = anonymousFunctionCounters[currentScope];
//     functionName = `(anonymous_${anonymousFunctionCounter})`;
//   }
//
//   return `${currentScope}.${functionName}`;
// }

// function generateFunctionScopeName(scopeStack, anonymousFunctionCounters, node, parent) {
//   const currentScope = scopeStack[scopeStack.length - 1];
//   let functionName;
//
//   if (node.id) {
//     // Named function
//     functionName = node.id.name;
//   } else if (parent && parent.type === 'Property' && parent.key) {
//     // Function within an object, use the key as the name
//     functionName = parent.key.type === 'Identifier' ? parent.key.name : String(parent.key.value);
//   } else {
//     // Anonymous function
//     anonymousFunctionCounters[currentScope] = (anonymousFunctionCounters[currentScope] || 0) + 1;
//     const anonymousFunctionCounter = anonymousFunctionCounters[currentScope];
//     functionName = `(anonymous_${anonymousFunctionCounter})`;
//   }
//
//   return `${currentScope}.${functionName}`;
// }

// function generateFunctionScopeName(scopeStack, functionCountersByScope, node, parent) {
//   const currentScope = scopeStack[scopeStack.length - 1];
//   let functionName;
//
//   if (node.id) {
//     // Named function
//     functionName = node.id.name;
//   } else if (parent && parent.type === 'Property' && parent.key) {
//     // Function within an object, use the key as the name
//     functionName = parent.key.type === 'Identifier' ? parent.key.name : String(parent.key.value);
//   } else if (parent && parent.type === 'CallExpression' && parent.callee && parent.callee.property) {
//     // Function used as a callback (like in .then() or .catch()), use method name as part of function name
//     const methodName = parent.callee.property.name;
//     functionCountersByScope[currentScope] = functionCountersByScope[currentScope] || {};
//     functionCountersByScope[currentScope][methodName] = (functionCountersByScope[currentScope][methodName] || 0) + 1;
//     const methodCount = functionCountersByScope[currentScope][methodName];
//     functionName = `(${methodName}_callback_${methodCount})`;
//   } else {
//     // Anonymous function
//     functionCountersByScope[currentScope] = functionCountersByScope[currentScope] || {};
//     functionCountersByScope[currentScope].anonymous = (functionCountersByScope[currentScope].anonymous || 0) + 1;
//     const anonymousFunctionCounter = functionCountersByScope[currentScope].anonymous;
//     functionName = `(anonymous_${anonymousFunctionCounter})`;
//   }
//
//   return `${currentScope}.${functionName}`;
// }

// function generateFunctionScopeName(scopeStack, functionCountersByScope, node, parent) {
//   const currentScope = scopeStack[scopeStack.length - 1];
//   let functionName;

//   if (node.id) {
//     // Named function
//     functionName = node.id.name;
//   } else if (parent && parent.type === 'Property' && parent.key) {
//     // Function within an object, use the key as the name
//     functionName = parent.key.type === 'Identifier' ? parent.key.name : String(parent.key.value);
//   } else if (parent && parent.type === 'CallExpression' && parent.callee && parent.callee.property) {
//     // Function used as a callback (like in .then() or .catch()), use method name as part of function name
//     const methodName = parent.callee.property.name;
//     const chainedFunctionName = getChainedFunctionName(parent.callee);
//
//     functionCountersByScope[currentScope] = functionCountersByScope[currentScope] || {};
//     functionCountersByScope[currentScope][methodName] = (functionCountersByScope[currentScope][methodName] || 0) + 1;
//
//     const methodCount = functionCountersByScope[currentScope][methodName];
//
//     // functionName = chainedFunctionName ? `(${chainedFunctionName}_${methodName}_callback_${methodCount})` : `(${methodName}_callback_${methodCount})`;
//     functionName = chainedFunctionName ? `(${chainedFunctionName}_callback_${methodCount})` : `(${methodName}_callback_${methodCount})`;
//   } else {
//     // Anonymous function
//     functionCountersByScope[currentScope] = functionCountersByScope[currentScope] || {};
//     functionCountersByScope[currentScope].anonymous = (functionCountersByScope[currentScope].anonymous || 0) + 1;
//     const anonymousFunctionCounter = functionCountersByScope[currentScope].anonymous;
//     functionName = `(anonymous_${anonymousFunctionCounter})`;
//   }
//
//   return `${currentScope}.${functionName}`;
// }

// function generateFunctionScopeName(
//   scopeStack,
//   functionCountersByScope,
//   node,
//   parent
// ) {
//   const currentScope = scopeStack[scopeStack.length - 1];
//   let functionName;
//
//   if (node.id) {
//     // Named function
//     functionName = node.id.name;
//   } else if (parent && parent.type === "Property" && parent.key) {
//     // Function within an object, use the key as the name
//     functionName =
//       parent.key.type === "Identifier"
//         ? parent.key.name
//         : String(parent.key.value);
//   } else if (
//     parent &&
//     parent.type === "CallExpression" &&
//     parent.callee &&
//     parent.callee.property
//   ) {
//     // Function used as a callback (like in .then() or .catch())
//     const chainedFunctionName = getChainedFunctionName(parent.callee);
//
//     const counterKey = chainedFunctionName || parent.callee.property.name;
//
//     const callbackCounter = getFunctionCounter(
//       functionCountersByScope,
//       currentScope,
//       counterKey
//     );
//
//     functionName = `(${counterKey}_callback_${callbackCounter})`;
//   } else {
//     // Anonymous function
//     const anonymousFunctionCounter = getFunctionCounter(
//       functionCountersByScope,
//       currentScope,
//       "anonymous"
//     );
//     functionName = `(anonymous_${anonymousFunctionCounter})`;
//   }
//
//   return `${currentScope}.${functionName}`;
// }
