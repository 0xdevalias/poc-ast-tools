const espree = require('espree');
const eslintScope = require('eslint-scope');

function analyzeCode(jsCode) {
  // Parse the JavaScript code into an AST
  const ast = espree.parse(jsCode, {
    ecmaVersion: 2020,
    sourceType: 'module',
    range: true
  });

  // Analyze the scopes in the AST
  const scopeManager = eslintScope.analyze(ast);

  // Function to recursively extract scope information
  function extractScopeInfo(scope) {
    const scopeInfo = {
      type: scope.type,
      variables: {},
      childScopes: []
    };

    // Extract variables and their types
    for (const variable of scope.variables) {
      scopeInfo.variables[variable.name] = variable.defs.map(def => def.type);
    }

    // Recursively process child scopes
    for (const childScope of scope.childScopes) {
      scopeInfo.childScopes.push(extractScopeInfo(childScope));
    }

    return scopeInfo;
  }

  // Extract information from the global scope
  return extractScopeInfo(scopeManager.globalScope);
}

// Example JavaScript code
const exampleJSCode = `
function example(a, b) {
    let x = 10;
    const y = 20;
    if (x < y) {
        let z = x + y;
        console.log(z);
    }
}
`;

// Analyzing the code
const scopeInfo = analyzeCode(exampleJSCode);
console.log(JSON.stringify(scopeInfo, null, 2));
