#!/usr/bin/env node

// -------------------------------------------------------------------------------------------------
// TODO: The variable scope parsing/rewriting is pretty horribly broken in this currently I think..
// it might be easier to try and write it in something other than esprima...
// -------------------------------------------------------------------------------------------------

// Ref: https://replit.com/@0xdevalias/Rewriting-JavaScript-Variables-via-AST-Examples#esprima_5_scope_extractor.js

// Ref:
//   https://chat.openai.com/c/07a322fd-ff60-4250-8e9c-cca0a732afce
//   https://chat.openai.com/c/482911c5-6dd4-4e67-8531-c17f786887d1
//
// Note: This is based off the implementation in esprima_5.js, but this version is designed to extract the variableMapping from an existing piece of code; which can then be used later to rename those mappings

// TODO: Save these scripts somewhere useful:
//   GITREF='HEAD' FILEREF='167'; git show ${GITREF}:../unpacked/_next/static/chunks/${FILEREF}.js | ./esprima_5_scope_extractor.js > variableMapping.${FILEREF}-${GITREF}.json
//   git diff --no-index --patch -- variableMapping.167-HEAD\^1.json variableMapping.167-HEAD.json

// TODO: Explore using estools/escope instead of the hacky implementations within this:
//   https://github.com/estools/escope

const fs = require('fs');

const {
  readAndParseVariableMappingFile,
  // makeDebugLog,
} = require('./lib/esprimaHelpers');

function diffVariableMappings(mapping1, mapping2) {
    const diff = {
        scopeAdded: {},
        scopeRemoved: {},
        scopeModified: {}
    };

    // Iterate through each scope in mapping1
    for (const scope in mapping1) {
        const scopeMapping1 = mapping1[scope];
        const scopeMapping2 = mapping2[scope];

        if (scope in mapping2) {
            // Create objects to hold the added, removed, and changed keys
            const added = {};
            const removed = {};
            const changed = {};

            // Check for keys in scopeMapping1 but not in scopeMapping2
            for (const key in scopeMapping1) {
                if (!(key in scopeMapping2)) {
                    removed[key] = scopeMapping1[key];
                } else if (scopeMapping1[key] !== scopeMapping2[key]) {
                    // Check for changed keys
                    changed[key] = { from: scopeMapping1[key], to: scopeMapping2[key] };
                }
            }

            // Check for keys in scopeMapping2 but not in scopeMapping1
            for (const key in scopeMapping2) {
                if (!(key in scopeMapping1)) {
                    added[key] = scopeMapping2[key];
                }
            }

            // Create an object to store the differences for this scope
            const scopeDiff = {};

            // Conditionally add added, removed, and changed to scopeDiff if non-empty
            if (Object.keys(added).length > 0) scopeDiff.added = added;
            if (Object.keys(removed).length > 0) scopeDiff.removed = removed;
            if (Object.keys(changed).length > 0) scopeDiff.changed = changed;

            // If there are differences, add them to the scopeModified under the scope
            if (Object.keys(scopeDiff).length > 0) {
                diff.scopeModified[scope] = scopeDiff;
            }
        } else {
            // If the scope is not in mapping2, it is entirely removed
            diff.scopeRemoved[scope] = scopeMapping1;
        }
    }

    // Check for scopes in mapping2 that are not in mapping1
    for (const scope in mapping2) {
        if (!(scope in mapping1)) {
            // If the scope is not in mapping1, it is entirely added
            diff.scopeAdded[scope] = mapping2[scope];
        }
    }

    // Remove empty sections
    if (Object.keys(diff.scopeAdded).length === 0) delete diff.scopeAdded;
    if (Object.keys(diff.scopeRemoved).length === 0) delete diff.scopeRemoved;
    if (Object.keys(diff.scopeModified).length === 0) delete diff.scopeModified;

    return diff;
}

// function diffVariableMappings(mapping1, mapping2) {
//     const diff = {};

//     // Iterate through each scope in mapping1
//     for (const scope in mapping1) {
//         const scopeMapping1 = mapping1[scope];
//         const scopeMapping2 = mapping2[scope];

//         if (scope in mapping2) {
//             // Create objects to hold the added, removed, and changed keys
//             const added = {};
//             const removed = {};
//             const changed = {};

//             // Check for keys in scopeMapping1 but not in scopeMapping2
//             for (const key in scopeMapping1) {
//                 if (!(key in scopeMapping2)) {
//                     removed[key] = scopeMapping1[key];
//                 } else if (scopeMapping1[key] !== scopeMapping2[key]) {
//                     // Check for changed keys
//                     changed[key] = { from: scopeMapping1[key], to: scopeMapping2[key] };
//                 }
//             }

//             // Check for keys in scopeMapping2 but not in scopeMapping1
//             for (const key in scopeMapping2) {
//                 if (!(key in scopeMapping1)) {
//                     added[key] = scopeMapping2[key];
//                 }
//             }

//             // Create an object to store the differences for this scope
//             const scopeDiff = {};

//             // Conditionally add added, removed, and changed to scopeDiff if non-empty
//             if (Object.keys(added).length > 0) scopeDiff.added = added;
//             if (Object.keys(removed).length > 0) scopeDiff.removed = removed;
//             if (Object.keys(changed).length > 0) scopeDiff.changed = changed;

//             // If there are differences, add them to the diff under the scope
//             if (Object.keys(scopeDiff).length > 0) {
//                 diff[scope] = scopeDiff;
//             }
//         } else {
//             // If the scope is not in mapping2, consider it as entirely removed
//             diff[scope] = { removed: scopeMapping1 };
//         }
//     }

//     // Check for scopes in mapping2 that are not in mapping1
//     for (const scope in mapping2) {
//         if (!(scope in mapping1)) {
//             diff[scope] = { added: mapping2[scope] };
//         }
//     }

//     return diff;
// }

// function diffVariableMappings(mapping1, mapping2) {
//   const diff = {};

//   // Iterate through each scope in mapping1
//   for (const scope in mapping1) {
//       // If the scope is also in mapping2, compare the mappings
//       if (scope in mapping2) {
//           const scopeDiff = {};
//           const scopeMapping1 = mapping1[scope];
//           const scopeMapping2 = mapping2[scope];

//           // Check for keys in scopeMapping1 but not in scopeMapping2
//           for (const key in scopeMapping1) {
//               if (!(key in scopeMapping2)) {
//                   scopeDiff[key] = scopeMapping1[key];
//               }
//           }

//           // Check for keys in scopeMapping2 but not in scopeMapping1
//           for (const key in scopeMapping2) {
//               if (!(key in scopeMapping1)) {
//                   scopeDiff[key] = scopeMapping2[key];
//               }
//           }

//           // If there are differences, add them to the diff under the scope
//           if (Object.keys(scopeDiff).length > 0) {
//               diff[scope] = scopeDiff;
//           }
//       } else {
//           // If the scope is not in mapping2, add it to the diff
//           diff[scope] = mapping1[scope];
//       }
//   }

//   // Check for scopes in mapping2 that are not in mapping1
//   for (const scope in mapping2) {
//       if (!(scope in mapping1)) {
//           if (scope in diff) {
//             console.warn("WARNING: Scope from mapping2 overriding scope already in diff")
//           }
//           diff[scope] = mapping2[scope];
//       }
//   }

//   return diff;
// }

// function diffVariableMappings(mapping1, mapping2) {
//   const diffResult = {};

//   console.error("Mapping 1:", mapping1["global.(anonymous_330)"]);
//   console.error("Mapping 2:", mapping2["global.(anonymous_330)"]);

//   // Iterate through the scopes in mapping1
//   for (const [scope, variables] of Object.entries(mapping1)) {
//     // Check if the scope exists in mapping2
//     if (mapping2.hasOwnProperty(scope)) {
//       // Temporary store for variable differences in current scope
//       const scopeDiff = {};

//       // Compare variables within the scope
//       for (const [variable, mapping] of Object.entries(variables)) {
//         if (mapping2[scope][variable] !== mapping) {
//           // Add the different mapping to the scopeDiff
//           scopeDiff[variable] = mapping2[scope][variable];
//         }
//       }

//       // If there are differences in the scope, add them to diffResult
//       if (Object.keys(scopeDiff).length > 0) {
//         diffResult[scope] = scopeDiff;
//       }
//     }
//   }

//   // Iterate through the scopes in mapping2 to find scopes not present in mapping1
//   for (const [scope, variables] of Object.entries(mapping2)) {
//     if (!mapping1.hasOwnProperty(scope)) {
//       // If the scope does not exist in mapping1, we add it to the result.
//       diffResult[scope] = variables;
//     }
//   }

//   return diffResult;
// }

async function main() {
  if (process.argv.length !== 4) {
    console.error('Usage: node diffVariableMappings.js <file1.json> <file2.json>');
    process.exit(1);
  }

  const [file1Path, file2Path] = process.argv.slice(2);

  try {
    const mapping1 = await readAndParseVariableMappingFile(file1Path);
    const mapping2 = await readAndParseVariableMappingFile(file2Path);

    const diffResult = diffVariableMappings(mapping1, mapping2);

    console.log(JSON.stringify(diffResult, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
