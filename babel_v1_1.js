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
const processedBindings = new Set();

babel.traverse(ast, {
  Scopable(path) {
    const bindings = path.scope.getAllBindings();

    Object.keys(bindings).forEach((name) => {
      const binding = bindings[name];

      // Skip bindings from parent scopes.
      if (binding.scope !== path.scope) {
        console.log(`Skipping bindings from different scope uid=${path.scope.uid} (${path.scope.path.type})`);
        return;
      }

      // Generate a unique key for each binding with its scope.
      const uniqueKey = `${name}_${path.scope.uid}`;

      // Skip bindings that have already been processed
      if (processedBindings.has(uniqueKey)) {
        console.log(`Skipping binding as we have already processed it name=${name} (${binding.scope.path.type})`);
        return;
      }

      console.group("Binding Details"); // Start a console group
      console.log("***************************");
      console.log("Old name:", name);
      console.log("Scope type:", path.type);
      console.log("Scope uid:", path.scope.uid);
      console.log("Reference count:", binding.referencePaths.length);

      const newName = "var" + id++;
      binding.identifier.name = newName;

      console.log("New name:", newName);
      console.log("***************************");

      console.log(
        `Renaming refPaths of ${name} (old) / ${newName} (new) from scope ${binding.scope.uid} (${binding.scope.path.type}):`
      );
      binding.referencePaths.forEach((refPath) => {
        console.log(`${refPath.node.name} in scope ${refPath.scope.uid}`);

        refPath.node.name = newName;
      });

      console.log("***************************");
      console.groupEnd(); // End the console group

      // Mark this binding as processed
      processedBindings.add(uniqueKey);
    });
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