const jscodeshift = require('jscodeshift').withParser('babylon');

const sourceCode = `
function p() {
  var e = (0, r._)([
    "foo",
    "bar",
    "baz",
  ]);
  return (
    (p = function () {
      return e;
    }),
    e
  );
}

function q() {
  var e = (0, r._)([
    "foo",
    "bar",
    "baz",
  ]);

  return e;
}
`;

const ast = jscodeshift(sourceCode);

ast.find(jscodeshift.FunctionDeclaration)
  .forEach(path => {
    // Check if this function reassigns itself
    const hasSelfReassignment = jscodeshift(path)
      .find(jscodeshift.AssignmentExpression)
      .some(assignmentPath => {
        const left = assignmentPath.value.left;
        return left.type === 'Identifier' && left.name === path.value.id.name;
      });

    if (hasSelfReassignment) {
      const oldName = path.value.id.name
      const newName = `${path.value.id.name}Memo`

      // Rename the function
      path.value.id.name = newName;

      console.log(`Function ${oldName} is using a memoization pattern, renamed to ${newName}.`);
    } else {
      console.log(`Function ${path.value.id.name} is NOT using a memoization pattern.`);
    }
  });

// Further transformation code and printing the modified source code