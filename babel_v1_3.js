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
// const processedBindings = new Set();

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
// NEW GETPREFIX/ETC CODE START
// TODO: We sort of want the logic in getPrefix to work very similarly if not exactly like getNameFromPath
// function getPrefix({ path, binding, bindingName }) {
//   const debugLog = makeDebugLog(path);

//   // TODO: binding.kind is things like param, var, etc... might be worth passing that in to use here too

//   const prefix = (() => {
//     switch (path.type) {
//       case 'Program':
//         return '';
//       case 'FunctionDeclaration':
//         // console.log('path.listKey', path.listKey)
//         // console.log('path.key', path.key)
//         // console.log('path.parentKey', path.parentKey)
//         debugLog('path.getPathLocation()', path.getPathLocation())
//         // console.log(path)
//         // TODO: can we get the name of the function?
//         // return 'func'; // TODO: This seems to be getting used for the args in a function, not the function name, so maybe this should be ${funcName}_arg?
//         return 'arg'
//       // case 'BlockStatement':
//       //   '';
//       // case 'VariableDeclaration':
//       //   return 'var';
//       // case 'Identifier':
//       //   return 'arg';
//       default:
//         return path.type;
//     }
//   })()

//   debugLog(`binding[${bindingName}].prefix=${prefix}`);

//   return prefix;
// }
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

      // TODO: Does this need to be handled here? Maybe if we make it blank here we could remove the extra check logic in the calling location to skip these for arrow functions?
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
// NEW GETPREFIX/ETC CODE END

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

    // console.log('[DEBUG] path.node Keys', Object.keys(path.node));
    // debugShowProperties(path.node, 'path.node');
    // console.log('[DEBUG] path.contexts Keys', Object.keys(path.contexts));
    // console.log('[DEBUG] path.context Keys', Object.keys(path.context));
    // console.log('[DEBUG] path.container Keys', Object.keys(path.container));
    // debugShowProperties(path.container, 'path.container');
    // console.log(path.container)

    // console.log('[DEBUG] path.scope Keys', Object.keys(path.scope));
    // debugShowProperties(path.scope, 'path.scope');

    // console.log('[DEBUG] path.scope.references', path.scope.references);
    // console.log('[DEBUG] path.scope.uids', path.scope.uids);
    // console.log('[DEBUG] path.scope.labels', path.scope.labels);
    // console.log('[DEBUG] path.scope.globals', path.scope.globals);
    // console.log('[DEBUG] path.scope.data', path.scope.data);

    // console.log('[DEBUG] path.scope.block Keys', Object.keys(path.scope.block));
    // debugShowProperties(path.scope.block, 'path.scope.block');

    console.groupEnd();

    // TODO: replace this with path.scope.bindings instead as that gives just the local bindings
    // const bindings = path.scope.getAllBindings();
    const bindings = path.scope.bindings;

    debugLogScopeBindings({ path });

    // TODO: does this take into account if the current scope has a decent name on it that we should be using?
    // TODO: This seems to not play nicely with our new renaming logic below
    // const prefix = getPrefix({ path });
    // console.log({ prefix });

    // TODO: Instead of Object.entries, can we just read the name from the binding object itself? And if so.. do we actually want to?
    Object.entries(bindings).forEach(([name, binding]) => {
      const prefix = getPrefix({ path, binding, bindingName: name });

      // TODO: do we need this part anymore now that we switched from path.scope.getAllBindings() to path.scope.bindings? Looks like maybe not?
      // Skip bindings from parent scopes.
      // if (binding.scope !== path.scope) {
      //   console.log(`Skipping bindings from different scope uid=${path.scope.uid} (${path.scope.path.type})`);
      //   return;
      // }

      // // TODO: should we change the way we're doing this?
      // // TODO: This won't actually work properly.. as name will change when we rename it.. so need to pick a unique identifier for the binding if we want to do it..
      // // Generate a unique key for each binding with its scope.
      // const uniqueKey = `${name}_${path.scope.uid}`;
      // 
      // // TODO: do we need this part anymore now that we switched from path.scope.getAllBindings() to path.scope.bindings? Looks like maybe not?
      // // Skip bindings that have already been processed
      // if (processedBindings.has(uniqueKey)) {
      //   console.log(`Skipping binding as we have already processed it name=${name} scope=${binding.scope.uid} (${binding.scope.path.type})`);
      //   return;
      // }

      // TODO: does this take into account if the current scope has a decent name on it that we should be using?
      const newName = prefix ? `${prefix}_${name}` : name;
      // NEW RENAMING LOGIC
      // TODO: this doesn't seem to work nicely with how prefix / getPrefix works currently.. need to look into it better.. looks like this:
      // function foo(func_2_var_1_func_1_a) {
      //   var func_2_var_1_func_1_b = func_2_var_1_func_1_a + 1;
      //   return func_2_var_1_func_1_b;
      // }
      // function bar(func_4_var_1_func_3_a) {
      //   var func_4_var_1_func_3_c = func_4_var_1_func_3_a - 1;
      //   return func_4_var_1_func_3_c;
      // }

      // TODO: If path.type == BlockStatement && path.parent.type == FunctionDeclaration then don't rename
      //  Is it path.parent or path.parentPath that we want? They both seem to do similar in this instance..
      // if (path.type === 'BlockStatement') {
      //   console.log('path.parent.type', path.parent.type)
      //   console.log('path.parentPath.type', path.parentPath.type)
      // }
      const isBlockStatement = path.type === 'BlockStatement';
      // const isParentFunctionDeclaration = path.parent.type === 'FunctionDeclaration';
      const isParentFunction = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(path.parent.type);
      const shouldRename = !isBlockStatement || (isBlockStatement && !isParentFunction)

      if (shouldRename) {
        console.log(`Renaming ${name} to ${newName} in scope ${path.scope.uid} (${path.scope.path.type})`);
        path.scope.rename(name, newName);
      } else {
        console.log(`Skipping rename from ${name} to ${newName} in scope ${path.scope.uid} (${path.scope.path.type})`);
      }
      // END NEW RENAMING LOGIC
      // OLD RENAMING LOGIC
      // binding.identifier.name = newName;
      //
      // // TODO: Do we actually have to handle this manually, or the lib handle it for us somehow..?
      // // Rename reference paths as well
      // binding.referencePaths.forEach((refPath) => {
      //   refPath.node.name = newName;
      // });
      // END OLD RENAMING LOGIC

      // // TODO: do we need this part anymore now that we switched from path.scope.getAllBindings() to path.scope.bindings?
      // // Mark this binding as processed
      // processedBindings.add(uniqueKey);
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