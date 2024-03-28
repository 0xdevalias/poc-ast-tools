const espree = require('espree');
const eslintScope = require('eslint-scope');

const DEBUG = true;

// TODO: Currently this script recursively passes through the childScopes of the globalScope.. but we can also just access the array of scopes directly from scopeManager.scopes; I wonder if that would be simpler/easier/quicker..?
//  https://eslint.org/docs/latest/extend/scope-manager-interface#scopes

// Other potentially useful docs
//   https://eslint.org/docs/latest/extend/scope-manager-interface
//     ScopeManager object has all variable scopes.
//     https://eslint.org/docs/latest/extend/scope-manager-interface#getdeclaredvariablesnode
//       getDeclaredVariables(node)
//       Get the variables that a given AST node defines.
//   https://eslint.org/docs/latest/extend/scope-manager-interface#scope-interface
//     Scope object has all variables and references in the scope.
//     type: The type of this scope. This is one of "block", "catch", "class", "class-field-initializer", "class-static-block", "for", "function", "function-expression-name", "global", "module", "switch", "with".
//     upper: The parent scope. If this is the global scope then this property is null.
//     childScopes: The array of child scopes. This does not include grandchild scopes.
//     variableScope: The nearest ancestor whose type is one of "class-field-initializer", "class-static-block", "function", "global", or "module". For the aforementioned scopes this is a self-reference. This represents the lowest enclosing function or top-level scope. Class field initializers and class static blocks are implicit functions. Historically, this was the scope which hosts variables that are defined by var declarations, and thus the name variableScope.
//   https://eslint.org/docs/latest/extend/scope-manager-interface#variable-interface
//     Variable interface
//     name: The name of this variable.
//     scope: The scope in which this variable is defined.
//     defs: The array of the definitions of this variable.
//     references: The array of the references of this variable.
//   https://eslint.org/docs/latest/extend/scope-manager-interface#reference-interface
//     Reference interface
//     from: The Scope object that this reference is on.
//     isWrite(): true if this reference is writing.
//     isRead(): true if this reference is reading.
//     isWriteOnly(): true if this reference is writing but not reading.
//     isReadOnly(): true if this reference is reading but not writing.
//     isReadWrite(): true if this reference is reading and writing.
//   https://eslint.org/docs/latest/extend/scope-manager-interface#definition-interface
//     Definition interface
//     type: The type of this definition. One of "CatchClause", "ClassName", "FunctionName", "ImplicitGlobalVariable", "ImportBinding", "Parameter", and "Variable".
//     name: The Identifier node of this definition.
//     node: The enclosing node of the name.
//       "CatchClause": CatchClause
//       "ClassName": ClassDeclaration or ClassExpression
//       "FunctionName":  FunctionDeclaration or FunctionExpression
//       "ImplicitGlobalVariable":  Program
//       "ImportBinding": ImportSpecifier, ImportDefaultSpecifier, or ImportNamespaceSpecifier
//       "Parameter": FunctionDeclaration, FunctionExpression, or ArrowFunctionExpression
//       "Variable":  VariableDeclarator
//     parent: The enclosing statement node of the name.
//       "CatchClause" null
//       "ClassName" null
//       "FunctionName"  null
//       "ImplicitGlobalVariable"  null
//       "ImportBinding" ImportDeclaration
//       "Parameter" null
//       "Variable"  VariableDeclaration

// Example JavaScript code
// const exampleJSCode = `
// window.foo = "foo";

// const foo = thisIsNotDefined;

// function example(a, b) {
//     let x = 10;
//     const y = 20;
//     if (x < y) {
//         let z = x + y + a + b;
//         console.log(z);
//     }

//     function innerFunction(ifA, ifB) {
//       // Foo
//     }

//     const innerArrowFunction = (iafA, iafB) => {
//       // Bar
//     }
// }
// `;

const exampleJSCode = `
const x = 42
{
  const x = 47
  console.log(x)
}
console.log(x)
`

function analyzeCode(jsCode) {
  const commonParserOptions = {
    ecmaVersion: 2020,
    sourceType: 'module', // script, module, commonjs
  }
    
  // Parse the JavaScript code into an AST with range information
  const ast = espree.parse(jsCode, {
    ...commonParserOptions,
    range: true  // Include range information
  });

  // Analyze the scopes in the AST
  // See the .analyze options in the source for more details
  //   https://github.com/eslint/eslint-scope/blob/957748e7fb741dd23f521af0c124ce6da0848997/lib/index.js#L111-L131
  // See the following for more details on the ScopeManager interface:
  //  https://eslint.org/docs/latest/extend/scope-manager-interface
  //  https://github.com/eslint/eslint-scope/blob/main/lib/scope-manager.js
  const scopeManager = eslintScope.analyze(
    ast,
    {
      ...commonParserOptions,
      nodejsScope: false,
    }
  );

  // DEBUG && console.log('ScopeManager.scopes=', scopeManager.scopes)

  function extractScopeInfo(scope) {
    DEBUG && console.log('\n-= SCOPE INFO =-');
    DEBUG && console.log(
      // scope
      `Scope: type=${scope.type} (block.type=${scope.block.type})`,
      `block.id?.name=${scope.block.id?.name}`,
      `implicit=${scope.implicit?.left?.map(ref => ref.identifier.name)}`
    );

    DEBUG && scope.variables.forEach(variable => {
      if (variable.name === 'arguments') return;

      console.log(
        'Variable:',
        variable.name,
        // JSON.stringify(variable.defs, null, 2),
        variable.defs.map(def => ({
          name: def.name.name,
          type: def.type,
          kind: def.kind
        })),
        `References: ${variable.references.length}`
      );
    });

    // Include implicit globals if this is the global scope
    const implicitGlobals =
      scope.type === "global"
        ? scope.implicit.left.map((ref) => ref.identifier.name)
        : undefined;

    // Extract info about variable identifiers / symbols in this scope
    const identifiers = scope.variables.map(variable => ({
      name: variable.name,
      types: variable.defs.map(def => ({ type: def.type, kind: def.kind }))
    }))

    // Recursively process child scopes
    const childScopes = scope.childScopes.map(extractScopeInfo);

    return {
      type: scope.type,
      implicitGlobals,
      identifiers,
      childScopes,
    };
  }

  // Return the analysis result
  return extractScopeInfo(scopeManager.globalScope);
}

// Analyzing the code
const scopeInfo = analyzeCode(exampleJSCode);
DEBUG && console.log('\n-= ANALYSIS RESULT =-');
console.log(JSON.stringify(scopeInfo, null, 2));
