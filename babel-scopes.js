const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const code = `
const x = 42;
{
  const x = 47;
  console.log(x);
}
console.log(x);
`;

const ast = parser.parse(code, {
  sourceType: 'module',
  // plugins: [
  //   // Add any necessary plugins
  // ],
});

const scopes = new Set();

function collectScopes(path) {
  if (path.scope && !scopes.has(path.scope)) {
    scopes.add(path.scope);
    path.scope.parent && collectScopes(path.findParent((p) => p.scope));
  }
}

traverse(ast, {
  enter(path) {
    collectScopes(path);
  },
});

console.log("\n-= Scopes and Bindings =-\n");
scopes.forEach((scope) => {
  console.group(
    `Scope (uid=${scope.uid}, path.type=${scope.path.type})`
  );
  console.log(
    'Bindings:',
    JSON.stringify(Object.keys(scope.bindings), null, 2)
  );
  // console.log(scope);
  console.groupEnd();
  console.log();
});
