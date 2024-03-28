// ChatGPT Refs:
//   https://chat.openai.com/c/e65996fc-6607-4209-a082-6bc086c4f043
//   https://chat.openai.com/c/b8596908-5e17-4aac-941b-aa95962de9c2
//   https://chat.openai.com/c/4fc379b2-2760-43ef-9b1b-9b0d2e25768b
//   https://chat.openai.com/c/174c4c91-8a4f-4acf-b605-59f22ce03bad

const babel = require("@babel/core");
const generate = require("@babel/generator").default;

const code = `
function foo(a) {
  var b = a + 1;
  return b;
}

function bar(a) {
  var c = a - 1;
  return c;
}
`;

const ast = babel.parse(code);

let id = 0;

// -------------------------------------
// Only Processes Binding Renames Once
// -------------------------------------
// const processedBindings = new Set();

// babel.traverse(ast, {
//   Scopable(path) {
//     const bindings = path.scope.getAllBindings();

//     Object.keys(bindings).forEach((name) => {
//       const binding = bindings[name];

//       // Skip bindings from parent scopes.
//       if (binding.scope !== path.scope) {
//         console.log(`Skipping bindings from different scope uid=${path.scope.uid} (${path.scope.path.type})`);
//         return;
//       }

//       // Generate a unique key for each binding with its scope.
//       const uniqueKey = `${name}_${path.scope.uid}`;

//       // Skip bindings that have already been processed
//       if (processedBindings.has(uniqueKey)) {
//         console.log(`Skipping binding as we have already processed it name=${name} (${binding.scope.path.type})`);
//         return;
//       }

//       console.group("Binding Details"); // Start a console group
//       console.log("***************************");
//       console.log("Old name:", name);
//       console.log("Scope type:", path.type);
//       console.log("Scope uid:", path.scope.uid);
//       console.log("Reference count:", binding.referencePaths.length);

//       const newName = "var" + id++;
//       binding.identifier.name = newName;

//       console.log("New name:", newName);
//       console.log("***************************");

//       console.log(
//         `Renaming refPaths of ${name} (old) / ${newName} (new) from scope ${binding.scope.uid} (${binding.scope.path.type}):`
//       );
//       binding.referencePaths.forEach((refPath) => {
//         console.log(`${refPath.node.name} in scope ${refPath.scope.uid}`);

//         refPath.node.name = newName;
//       });

//       console.log("***************************");
//       console.groupEnd(); // End the console group

//       // Mark this binding as processed
//       processedBindings.add(uniqueKey);
//     });
//   },
// });

// -------------------------------------
// WIP to rename more structurally
// -------------------------------------
const prefixCounts = new Map();
const processedBindings = new Set();

const getTypePrefix = (type) => {
  switch (type) {
    case 'Program':
      return '';
    case 'FunctionDeclaration':
      return 'func';
    case 'BlockStatement':
      '';
    case 'VariableDeclaration':
      return 'var';
    case 'Identifier':
      return 'arg';
    default:
      return type;
  }
};

function getPrefix(path) {
  const parentPrefix = path.parentPath ? getPrefix(path.parentPath) : '';
  const typePrefix = getTypePrefix(path.type);
  const combinedPrefix = parentPrefix ? `${parentPrefix}_${typePrefix}` : typePrefix;
  // const combinedPrefix = parentPrefix && typePrefix ? `${parentPrefix}_${typePrefix}` : `${parentPrefix}${typePrefix}`;
  const count = (prefixCounts.get(combinedPrefix) || 0) + 1;
  prefixCounts.set(combinedPrefix, count);
  const combinedPrefixWithCount = combinedPrefix ? `${combinedPrefix}_${count}` : '';

  // TODO: remove debug log
  console.log(parentPrefix, typePrefix, combinedPrefix, combinedPrefixWithCount);

  return combinedPrefixWithCount;
}

// TODO: make this capable of properly traversing all of the bindings/references like we used to be able to do.. as well as ensuring that we only process a scope/identifier once
// TODO: Can we just use the same Scopable implementation we did earlier + the new getPrefix logic?
babel.traverse(ast, {
  FunctionDeclaration(path) {
    const prefix = getPrefix(path);
    path.node.id.name = prefix;

    path.traverse({
      Identifier(path) {
        // TODO: I think this part is wrong based on our rules.. we don't want to use the existing node name at all.. we want to use the generated index name for it again..
        if (path.node.name !== prefix && path.scope.hasBinding(path.node.name)) {
          path.node.name = prefix + "_" + path.node.name;
        }
      },
      FunctionDeclaration(path) {
        path.skip();
      }
    });
  },

  VariableDeclaration(path) {
    if (path.parentPath.type !== 'FunctionDeclaration') {
      const prefix = getPrefix(path);
      path.traverse({
        Identifier(path) {
          if (path.scope.hasBinding(path.node.name)) {
            path.node.name = prefix + "_" + path.node.name;
          }
        }
      });
    }
  },
});

const output = generate(ast, {}, code);

console.group('Before:');
console.log(code);
console.groupEnd();

console.group('After:');
console.log(output.code);
console.groupEnd();