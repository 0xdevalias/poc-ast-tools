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
// Debug code to show us the various scopes/etc being processed
// -------------------------------------
const debugLogScopeBindings = ({ path }) => {
  const scopeBindings = path.scope.bindings;
  const allBindings = path.scope.getAllBindings();

  console.group(`PathScope: ${path.scope.uid} (${path.type})`);

  console.group('Scope Bindings');

  console.table(
    Object.entries(scopeBindings).map(([bindingName, binding]) => {
      return {
        name: bindingName,
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
        scopeUid: binding.scope.uid,
        scopeType: binding.scope.path.type,
      }
    })
  );

  console.groupEnd();

  console.log(path.toString());

  console.groupEnd();
}

babel.traverse(ast, {
  Scopable(path) {
    debugLogScopeBindings({ path })
  }
});

const output = generate(ast, {}, code);

console.log('------------');

console.group('Before:');
console.log(code);
console.groupEnd();

console.group('After:');
console.log(output.code);
console.groupEnd();