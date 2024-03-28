// ChatGPT Refs:
//   https://chat.openai.com/c/e65996fc-6607-4209-a082-6bc086c4f043
//   https://chat.openai.com/c/b8596908-5e17-4aac-941b-aa95962de9c2
//   https://chat.openai.com/c/4fc379b2-2760-43ef-9b1b-9b0d2e25768b
//   https://chat.openai.com/c/174c4c91-8a4f-4acf-b605-59f22ce03bad

// Refs:
// - https://babeljs.io/
//   - https://babeljs.io/docs/babel-parser
//     - > The Babel parser (previously Babylon) is a JavaScript parser used in Babel
//     - > Heavily based on `acorn` and `acorn-jsx`
//     - https://babeljs.io/docs/babel-parser#api
//     - https://babeljs.io/docs/babel-parser#output
//       - > The Babel parser generates AST according to Babel AST format. It is based on ESTree spec with the following deviations...
//         - https://github.com/babel/babel/blob/main/packages/babel-parser/ast/spec.md
//       - > AST for JSX code is based on Facebook JSX AST
//         - https://github.com/facebook/jsx/blob/main/AST.md
//     - https://babeljs.io/docs/babel-parser#plugins
//       - https://babeljs.io/docs/babel-parser#language-extensions
//         - > Language extensions
//       - https://babeljs.io/docs/babel-parser#ecmascript-proposals
//         - > ECMAScript proposals
//       - https://babeljs.io/docs/babel-parser#latest-ecmascript-features
//         - > The following features are already enabled on the latest version of `@babel/parser`, and cannot be disabled because they are part of the language. You should enable these features only if you are using an older version.
//   - https://babeljs.io/docs/babel-traverse
//     - > We can use it alongside the `babel` parser to traverse and update nodes
//   - https://babeljs.io/docs/babel-types
//     - https://babeljs.io/docs/babel-types#aliases
//       - https://babeljs.io/docs/babel-types#scopable
//         - > A cover of `FunctionParent` and `BlockParent`.
//         - https://babeljs.io/docs/babel-types#functionparent
//           - > A cover of AST nodes that start an execution context with new `VariableEnvironment`. In other words, they define the scope of `var` declarations. `FunctionParent` did not include `Program` since Babel 7.
//         - https://babeljs.io/docs/babel-types#blockparent
//           - > A cover of AST nodes that start an execution context with new `LexicalEnvironment`. In other words, they define the scope of `let` and `const` declarations.

const babel = require("@babel/core");
const generate = require("@babel/generator").default;

const DEBUG = true;

const DEBUG_SHOW_EXTRA_BINDING_DETAILS = false;

const MAX_CODE_CONTEXT_LENGTH = 500;

const code = `
const aa = 5;

function foo(a) {
  var b = a + aa + 1;
  b = 7;
  return b;
}

function bar(a) {
  var c = a - aa - 1;
  return c;
}

const baz = (a = 123) => {
  let d = a * aa * 2;
  return d;
}
`;

// const code = `
// const aa = 5;

// function foo(a) {
//   var b = a + aa + 1;
//   b = 7;
//   return b;
// }

// function bar(a) {
//   var c = a - aa - 1;
//   return c;
// }

// const baz = (a = 123) => {
//   let d = a * aa * 2;
//   return d;
// }

// let boink = function(a) {
//   let e = a * aa * 2;
//   return e;
// }

// foo(111)

// const xx = {
//   foo: () => { "foo" }
// }
// console.log(xx.foo); 

// class Foo {}
// `;

const prefixCounts = new Map();

const makeDebugLog = (path) => (...messages) => {
  if (!DEBUG) return;

  // console.log(`[DEBUG::${path.getPathLocation()}::${path.type}]`, ...messages);

  const name = getNameFromPath(path) || 'NO_NAME';

  console.log(`[DEBUG::${name}::${path.type}]`, ...messages);
}

const debugShowProperties = (obj, label = '') => {
  if (!DEBUG) return

  console.group('[DEBUG] debugShowProperties', label ? `(${label})` : undefined);

  console.group('Object.getOwnPropertyNames');
  console.log(Object.getOwnPropertyNames(obj))
  console.groupEnd();

  console.group('Object.getOwnPropertyNames(Object.getPrototypeOf)');
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(obj)))
  console.groupEnd();

  console.groupEnd();
}

const debugLogScopeBindings = ({ path }) => {
  if (!DEBUG) return

  const debugLog = makeDebugLog(path);

  const scopeBindings = path.scope.bindings;
  const allBindings = path.scope.getAllBindings();

  const nameFromPath = getNameFromPath(path);

  console.group(`[DEBUG] Path (type=${path.type}, nameFromPath=${nameFromPath}, pathLocation=${path.getPathLocation()})`);

  console.group('Code');

  console.log(path.toString().slice(0, MAX_CODE_CONTEXT_LENGTH));

  console.groupEnd();

  console.group(`Scope Dump (uid=${path.scope.uid})`);

  path.scope.dump();

  console.groupEnd();

  console.group('Scope Bindings');

  console.table(
    Object.entries(scopeBindings).map(([bindingName, binding]) => {
      return {
        name: bindingName,
        kind: binding.kind,
        references: binding.references,
        scopeUid: binding.scope.uid,
        scopeType: binding.scope.path.type,
      }
    })
  );

  console.groupEnd();

  console.group('All Bindings');

  console.table(
    Object.entries(allBindings).map(([bindingName, binding]) => {
      return {
        name: bindingName,
        kind: binding.kind,
        references: binding.references,
        scopeUid: binding.scope.uid,
        scopeType: binding.scope.path.type,
      }
    })
  );

  console.groupEnd();

  console.group('Extra Binding Details');

  if (DEBUG_SHOW_EXTRA_BINDING_DETAILS) {
    Object.entries(scopeBindings).forEach(([bindingName, binding]) => {
      console.group(bindingName);
  
      // console.log('Binding', binding)
      // debugLog('binding Keys', Object.keys(binding))
  
      console.log('[DEBUG] binding.{various chosen bits}', {
        bindingCode: binding.path.toString(),
        identifierName: binding.identifier.name,
        identifierLocName: binding.identifier.loc.identifierName,
        identifierLocFilename: binding.identifier.loc.filename,
        // hasDeoptedValue: binding.hasDeoptedValue,
        // hasValue: binding.hasValue,
        // value: binding.value,
        bindingPathLocation: binding.path.getPathLocation(),
        referencePaths: binding.referencePaths.map(path => ({
          pathLocation: path.getPathLocation(),
          nodeName: path.node.name,
          nodeLoc: path.node.loc,
          state: path.state,
        })),
      });
  
      console.groupEnd();
    });
  } else {
    console.log('Disabled by DEBUG_SHOW_EXTRA_BINDING_DETAILS')
  }

  console.groupEnd();

  console.groupEnd();
}

// TODO: do we want to add some context from the node.path.type as well? (eg. instead of a func just being "foo" it might be "func foo")
function getNameFromPath(path) {
  if (!path) return undefined;

  const { parentPath } = path;
  const node = path.node ? path.node : path

  switch (node.type) {
    case 'Program':
      return '[[Program]]'
      
    case 'Identifier':
      return node.name;

    case 'VariableDeclarator':
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
      return getNameFromPath(node.id);

    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      return getNameFromPath(parentPath);

    case 'BlockStatement':
      const blockParentName = getNameFromPath(parentPath);
      return `${blockParentName}::block{}`

    case 'CallExpression':
      return getNameFromPath(node.callee);

    case 'ObjectProperty':
      return getNameFromPath(node.key);

    case 'MemberExpression':
      const memberObjectName = getNameFromPath(node.object)
      const memberPropertyName = getNameFromPath(node.property)

      return `${memberObjectName}.${memberPropertyName}`;

    default:
      console.log('[getNameFromPath]: Unhandled node.type', node.type)
      return undefined;
  }
}

// OLD GETPREFIX/ETC CODE START
// // TODO: We might want to refactor this so that we can check the parent/etc as well?
// //   Eg. for a function's arguments we probably want to look at:
// //     Identifier that has a parent of FunctionDeclaration
// const getTypePrefix = (type) => {
//   switch (type) {
//     case 'Program':
//       return '';
//     case 'FunctionDeclaration':
//       return 'func';
//     case 'BlockStatement':
//       '';
//     case 'VariableDeclaration':
//       return 'var';
//     case 'Identifier':
//       return 'arg';
//     default:
//       return type;
//   }
// };
// 
// function getPrefix(path) {
//   const parentPrefix = path.parentPath ? getPrefix(path.parentPath) : '';
//   const typePrefix = getTypePrefix(path.type);
//   const combinedPrefix = parentPrefix ? `${parentPrefix}_${typePrefix}` : typePrefix;
//   // const combinedPrefix = parentPrefix && typePrefix ? `${parentPrefix}_${typePrefix}` : `${parentPrefix}${typePrefix}`;
//   const count = (prefixCounts.get(combinedPrefix) || 0) + 1;
//   prefixCounts.set(combinedPrefix, count);
//   const combinedPrefixWithCount = combinedPrefix ? `${combinedPrefix}_${count}` : '';
// 
//   // TODO: remove debug log
//   console.log(
//     '[DEBUG] getPrefix',
//     { parentPrefix, typePrefix, combinedPrefix, combinedPrefixWithCount }
//   );
// 
//   return combinedPrefixWithCount;
// }
// OLD GETPREFIX/ETC CODE END
function getPrefix({ path, binding, bindingName }) {
  const debugLog = makeDebugLog(path);
  
  const prefix = (() => {
    switch (path.type) {
      case 'Program':
        return ''

      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        const funcName = getNameFromPath(path);
        return `${funcName}_${binding.kind}`

      // TODO: Do we want to name this based on it's parent scope's name?
      // case 'VariableDeclarator':
      //   // ???

      // TODO: Do we want to name this based on it's parent scope's name?
      // case 'ClassDeclaration':
      //   // ???

      case 'BlockStatement':
        const isParentFunction = [
          'FunctionDeclaration',
          'FunctionExpression',
          'ArrowFunctionExpression'
        ].includes(path.parent.type);
        
        return isParentFunction ? "" : getNameFromPath(path.parent);
        
      // TODO: does this actually need handling here?
      // case 'ObjectProperty':
      //   return getNameFromPath(node.key);
  
      default:
        return path.type;
    }
  })()

  debugLog(`binding[${bindingName}].prefix=${prefix}`);

  return prefix;
}

const ast = babel.parse(code);

let scopableCount = 0;

babel.traverse(ast, {
  Scopable(path) {
    scopableCount++;

    const debugLog = makeDebugLog(path);

    console.group(`=== Scopable ${scopableCount} (scopeUid=${path.scope.uid}) ===`);

    console.group('[DEBUG] Debug Context');

    // debugShowProperties(path, 'path');

    console.log('[DEBUG] path.{various chosen bits}', {
      key: path.key,
      type: path.type,
      hub: path.hub,
      state: path.state,
      data: path.data,
    });

    console.groupEnd();

    const bindings = path.scope.bindings;

    debugLogScopeBindings({ path });
    
    Object.entries(bindings).forEach(([name, binding]) => {
      const prefix = getPrefix({ path, binding, bindingName: name });

      const newName = prefix ? `${prefix}_${name}` : name;

      // const isBlockStatement = path.type === 'BlockStatement';
      // const isParentFunction = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(path.parent.type);
      // const shouldRename = !isBlockStatement || (isBlockStatement && !isParentFunction)

      // if (shouldRename) {
      if (name !== newName) {
        console.log(`Renaming ${name} to ${newName} in scope ${path.scope.uid} (${path.scope.path.type})`);
        path.scope.rename(name, newName);
      } else {
        // console.log(`Skipping rename from ${name} to ${newName} in scope ${path.scope.uid} (${path.scope.path.type})`);
        console.log(`No need to rename ${name} in scope ${path.scope.uid} (${path.scope.path.type})`);
      }
    });

    console.groupEnd();
  },
});

const output = generate(ast, {}, code);

console.log('------------');

console.group('Before:');
console.log(code);
console.groupEnd();

console.group('After:');
console.log(output.code);
console.groupEnd();