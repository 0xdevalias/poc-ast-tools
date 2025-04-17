#!/usr/bin/env node

// TODO: BUG: We currently don't update the line numbers in the diff when we remove lines, so the patch metadata is invalid
//   See also:
//     https://github.com/0xdevalias/chatgpt-source-watch/blob/main/scripts/fix-diff-headers.js
//     https://github.com/0xdevalias/udio-source-watch/blob/main/scripts/fix-diff-headers.js

// TODO: In compareNormalizedCodeDiffs
//   Maybe make a refactored compareNormalizedCodeDiffsV2 version of this function and revert the
//     existing to it's former state
//   Figure out how to use the results of arrayDiff to minimise the lines of changes we return for
//     this group, to just the ones that have actually changed after identifiers are normalised
//   Explore whether we can simplify the code for doing this by changing the comparator function used
//     by arrayDiff (or another of the jsDiff diff functions)

// TODO: If a group of diff changes isn't perfectly equal, can we at least make it smaller by removing/converting matching lines?
//   Maybe if a chunk has the same number of added/removed lines we could group it together? (would need to adjust the logic of normalising though maybe?)
//   eg.
//     52717⋮     │          ef = Y.initiallyHighlightedMessageId,
//     52718⋮     │          ep = Y.continueConversationUrl,
//     52719⋮     │          eb = Y.urlThreadId,
//     52720⋮     │          eS = null !== (0, ec.useContext)(ey.gB),
//     52721⋮     │          eU = (0, e_.rm)();
//     52722⋮     │        (0, em.ax)(
//          ⋮52748│          eu = Y.initiallyHighlightedMessageId,
//          ⋮52749│          ec = Y.continueConversationUrl,
//          ⋮52750│          eh = Y.urlThreadId,
//          ⋮52751│          em = null !== (0, ef.useContext)(ew.gB),
//          ⋮52752│          eg = eG().focusedView,
//          ⋮52753│          eC = (0, eO.rm)();
//          ⋮52754│        (0, eb.ax)(
//   eg.
//     53734⋮     │        e5 = en(26272),
//     53735⋮     │        e4 = en(90387),
//     53736⋮     │        e3 = en(79505),
//     53737⋮     │        e6 = en(90439),
//     53738⋮     │        e7 = en(58369),
//     53739⋮     │        e8 = en(36292),
//     53740⋮     │        tt = en(35250);
//     53741⋮     │      function ta(Y, et) {
//          ⋮53772│        e5 = en(40670),
//          ⋮53773│        e4 = en(26272),
//          ⋮53774│        e3 = en(90387),
//          ⋮53775│        e6 = en(79505),
//          ⋮53776│        e7 = en(90439),
//          ⋮53777│        e8 = en(58369),
//          ⋮53778│        tt = en(36292),
//          ⋮53779│        ta = en(35250);
//          ⋮53780│      function tu(Y, et) {

// TODO: Can we process chunks better that have context between their added/removed?
//   eg.
//     53705⋮53743│        eT,
//     53706⋮53744│        e_,
//     53707⋮53745│        ej,
//     53708⋮     │        eO,
//     53709⋮53746│        eM,
//          ⋮53747│        eO,
//     53710⋮53748│        eA,
//     53711⋮53749│        eP,
//     53712⋮53750│        eN,

// TODO: do we even need to fully parse with babel/parser? Can we just use a tokenizer then filter out the identifiers?
//   https://github.com/eslint/espree#tokenize
//     https://github.com/eslint/espree#options
//
//   See normalizeIdentifierNamesInCodeV3 which uses acorn's tokenizer
//
//   While I don't think @babel/parser exposes it's tokenizer directly (TODO: check that..), it does have an option that allows us to access the tokens during a normal parse..
//   I'm not sure if that will give us back tokens even when parsing fails.. but might be worth looking into to potentially minimise our dependencies even further..?
//   We could also potentially combine that with the `errorRecovery` option if we needed to be more robust.
//     https://babeljs.io/docs/babel-parser#api
//       Options
//         - tokens: Adds all parsed tokens to a tokens property on the File node
//         - ranges: Adds a range property to each node: [node.start, node.end]
//         - errorRecovery: By default, Babel always throws an error when it finds some invalid code. When this option is set to true, it will store the parsing error and try to continue parsing the invalid input file. The resulting AST will have an errors property representing an array of all the parsing errors. Note that even when this option is enabled, @babel/parser could throw for unrecoverable errors.
//         - strictMode: By default, ECMAScript code is parsed as strict only if a "use strict"; directive is present or if the parsed file is an ECMAScript module. Set this option to true to always parse files in strict mode.

// TODO: We could also try using a more error tolerant parser, like acorn's loose parser
//   https://github.com/acornjs/acorn/tree/master/acorn-loose/
//     An error-tolerant JavaScript parser written in JavaScript.
//     This parser will parse any text into an ESTree syntax tree that is a reasonable approximation of what it might mean as a JavaScript program.
//     It will, to recover from missing brackets, treat whitespace as significant, which has the downside that it might mis-parse a valid but weirdly indented file. It is recommended to always try a parse with the regular acorn parser first, and only fall back to this parser when that one finds syntax errors.
//   See normalizeIdentifierNamesInCodeV2
//     This seems to work pretty well!
//       But just using the tokenizer as in normalizeIdentifierNamesInCodeV3 seems like it might work even better..

// TODO: we need to figure out how to make this preserve the colouring from git diff colour moved when passed through it

// TODO: This seems to have all the relevant bits and pieces.. we just need to refactor it to process the diff lines better, rather than just logging outputs..
//   We essentially want to be able to:
//     - consume a diff
//     - parse it
//     - loop through the chunks
//     - group add/removes
//     - for groups with equal counts of removes/adds
//       - normalize the code to stabilize symbol names
//       - check if the normalized code is equal
//       - if it is, we can mark it to be filtered out of the diff
//         - we somehow need to figure out how to handle the context/etc lines on either side when we remove part of the diff like this
//     - once we have done all the above processing, we then want to 'unroll' the groups to get the filtered diff back
//     - ?maybe some more stuff here?

// TODO: Can we use jsDiff's diffChars/diffWords to suppress a diff chunk group (that doesn't currently parse as an AST) where the differences are only ~2 chars (or multiple chunks of 2 chars)?
//   This would help suppress a lot more of the minimised variable churn, without relying on us being able to fix all the related parsing errors

// TODO: Can we figure out how to detect/suppress a diff chunk where the added/removed lines were just shifted (with some context in between, so doesn't work with our current grouping method)
//   @@ -313,8 +313,8 @@
//     eh = 0,
//     eb = eu,
//     ew = 0,
//     -            eE = 0,
//     eS = 0,
//     +            eE = 0,
//     eT = 1,
//     e_ = 1,
//     ej = 1,

// https://github.com/sergeyt/parse-diff
//   Simple unified diff parser for JavaScript

// https://github.com/kpdecker/jsdiff
//   A javascript text differencing implementation
//
// TODO: explore jsdiff's ability to customize diffing
//   https://github.com/kpdecker/jsdiff#defining-custom-diffing-behaviors
//     The simplest way to customize tokenization behavior is to simply tokenize the texts you want to diff yourself, with your own code, then pass the arrays of tokens to diffArrays. For instance, if you wanted a semantically-aware diff of some code, you could try tokenizing it using a parser specific to the programming language the code is in, then passing the arrays of tokens to diffArrays.
//     To customize the notion of token equality used, use the comparator option to diffArrays
//
//     For even more customisation of the diffing behavior, you can create a new Diff.Diff() object, overwrite its castInput, tokenize, removeEmpty, equals, and join properties with your own functions, then call its diff(oldString, newString[, options]) method. The methods you can overwrite are used as follows:
//
//     - castInput(value): used to transform the oldString and newString before any other steps in the diffing algorithm happen. For instance, diffJson uses castInput to serialize the objects being diffed to JSON. Defaults to a no-op.
//     - tokenize(value): used to convert each of oldString and newString (after they've gone through castInput) to an array of tokens. Defaults to returning value.split('') (returning an array of individual characters).
//     - removeEmpty(array): called on the arrays of tokens returned by tokenize and can be used to modify them. Defaults to stripping out falsey tokens, such as empty strings. diffArrays overrides this to simply return the array, which means that falsey values like empty strings can be handled like any other token by diffArrays.
//     - equals(left, right): called to determine if two tokens (one from the old string, one from the new string) should be considered equal. Defaults to comparing them with ===.
//     - join(tokens): gets called with an array of consecutive tokens that have either all been added, all been removed, or are all common. Needs to join them into a single value that can be used as the value property of the change object for these tokens. Defaults to simply returning tokens.join('').
//
// TODO: explore whether jsdiff can parse an existing git diff directly (or if it only works for patches)

const { parseArgs } = require('util');
const path = require('path');
const { readFileSync, existsSync } = require('fs');
const { createInterface } = require('readline');
const { once } = require('events');

const parseDiff = require('parse-diff');
const { diffChars, diffWords, diffLines, diffArrays } = require('diff');

const acorn = require('acorn');
const acornLoose = require('acorn-loose');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

let DEBUG = false; // Initial debug state

/**
 * Displays usage information for the script.
 *
 * @param {string} scriptName - The name of the script for which to display usage information.
 */
function displayUsage(scriptName) {
  console.log(`Usage: ${scriptName} <file-path>
Options:
  --debug        Enable debug mode.
  -h, --help     Display this usage information.`);
}

/**
 * Parses command line arguments, reads the specified file, and returns its content.
 * Exits the process on argument errors or file read errors.
 *
 * @returns {Object} An object containing:
 *                   - code: The source code read from the file.
 */
async function parseArgsAndReadInput() {
  const scriptName = path.basename(process.argv[1]);

  const parsedArgs = (() => {
    try {
      return parseArgs({
        strict: true,
        allowPositionals: false,
        options: {
          debug: {
            type: 'boolean',
            default: false,
          },
          help: {
            type: 'boolean',
            short: 'h',
          },
          file: {
            type: 'string',
            short: 'f',
          },
        },
      });
    } catch (error) {
      displayUsage(scriptName);
      console.error('\nError: Invalid arguments provided.', error.message);
      process.exit(1);
    }
  })();

  if (parsedArgs.values.help) {
    displayUsage(scriptName);
    process.exit(0);
  }

  DEBUG = parsedArgs.values.debug || false;
  const filePath = parsedArgs.values.file;

  const hasStdin = !process.stdin.isTTY;

  if (filePath && filePath !== '-' && hasStdin) {
    console.error(
      `Error: Both file path and stdin were provided. Please provide only one.`
    );
    process.exit(1);
  }

  if (filePath === '-' && !hasStdin) {
    console.error(
      `Error: File path is set to read from stdin, but no stdin input was provided.`
    );
    process.exit(1);
  }

  if (!hasStdin && !existsSync(filePath)) {
    console.error(`Error: File does not exist at path ${filePath}`);
    process.exit(1);
  }

  const rawDiffText = hasStdin
    ? (await readAllStdin()).join('\n')
    : readFileSync(filePath, 'utf8');

  return {
    scriptName,
    filePath,
    rawDiffText,
  };
}

async function readAllStdin() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
    crlfDelay: Infinity,
  });

  const lines = [];
  rl.on('line', (line) => lines.push(line));
  await once(rl, 'close');

  return lines;
}

/**
 * Main entry point of the script. Parses input, analyzes data, and outputs results.
 */
async function main() {
  const { rawDiffText } = await parseArgsAndReadInput();

  // Parse the diff content
  const diffFiles = parseDiff(rawDiffText);
  const diffStats = diffFiles.map((file, fileIndex) => {
    const { chunks, additions, deletions } = file;

    return {
      file: fileIndex + 1,
      chunks: chunks.length,
      additions,
      deletions,
    };
  });
  console.error('[diff] diffStats:', diffStats);

  // Process each file in the diff
  const modifiedDiffFiles = diffFiles.map((file, fileIndex) => {
    const { deletions, additions } = file;

    console.error(`[diff] file ${fileIndex + 1}`, {
      chunks: file.chunks.length,
      additions,
      deletions,
    });

    const enrichedChunks = file.chunks.map((chunk, chunkIndex) => {
      const { content, changes } = chunk;

      const groupedChanges = groupChunkChanges(changes);
      // const groupedChanges = groupChunkChangesV2(chunk);

      DEBUG &&
        console.error(
          `[diff::debug] file ${fileIndex + 1}, chunk ${chunkIndex + 1}`,
          {
            content,
            changes: changes.length,
            groupedChanges: groupedChanges.length,
          }
        );

      const updatedGroupedChanges = groupedChanges.map((group, groupIndex) => {
        const { changes, isEqualModifiedLinesCount } = group;

        const errorContext = {
          file: fileIndex + 1,
          chunk: chunkIndex + 1,
          group: groupIndex + 1,
        };

        DEBUG &&
          console.error(
            `[diff::debug] file ${fileIndex + 1}, chunk ${
              chunkIndex + 1
            }, group ${groupIndex + 1}`,
            group
          );

        // TODO: Do we want to exit early? If so, we need to figure how to mimic the rest of the normalizedDiffResult object
        // if (!isEqualModifiedLinesCount) {
        //   DEBUG &&
        //     console.error(
        //       `[diff::debug] skipping group due to isEqualModifiedLinesCount being false`
        //     );
        //
        //   return group;
        // }

        const normalizedDiffResult = compareNormalizedCodeDiffs(
          changes,
          errorContext
        );
        // const normalizedDiffResult = compareNormalizedCodeDiffsV2(
        //   changes,
        //   errorContext
        // );

        // TODO: do we want to keep or remove this isEqualModifiedLinesCount if statement?
        // Minimise the logging to only show those we're properly normalising/comparing
        // isEqualModifiedLinesCount &&
        DEBUG &&
          console.error(
            `[diff::debug] file ${fileIndex + 1}, chunk ${
              chunkIndex + 1
            }, group ${groupIndex + 1}`,
            {
              ...group,
              ...normalizedDiffResult,
            }
          );

        return {
          ...group,
          ...normalizedDiffResult,
        };
      });

      const stats = updatedGroupedChanges.reduce(
        (acc, group) => {
          const totalGroups = acc.totalGroups + 1;

          const contextGroups =
            acc.contextGroups + (group.isContextGroup ? 1 : 0);

          const equalModifiedLinesGroups =
            acc.equalModifiedLinesGroups +
            (group.isEqualModifiedLinesCount ? 1 : 0);

          const normalisedCodeEqualGroups =
            acc.normalisedCodeEqualGroups +
            (group.isNormalisedCodeEqual ? 1 : 0);

          // Calculate remaining change groups after excluding context groups and those with normalized code equal
          const remainingChangeGroupsAfterFilter =
            totalGroups - contextGroups - normalisedCodeEqualGroups;

          return {
            totalGroups,
            contextGroups,
            equalModifiedLinesGroups,
            normalisedCodeEqualGroups,
            remainingChangeGroupsAfterFilter,
          };
        },
        {
          totalGroups: 0,
          contextGroups: 0,
          equalModifiedLinesGroups: 0,
          normalisedCodeEqualGroups: 0,
          remainingChangeGroupsAfterFilter: 0,
        }
      );

      return {
        ...chunk,
        groupedChanges,
        updatedGroupedChanges,
        stats,
      };
    });

    enrichedChunks.forEach((chunk, chunkIndex) => {
      console.error(
        `[diff] file ${fileIndex + 1}, chunk ${chunkIndex + 1} stats`,
        chunk.stats
      );
    });

    const cumulativeStats = enrichedChunks.reduce(
      (acc, chunk) => {
        return {
          totalGroups: acc.totalGroups + chunk.stats.totalGroups,
          contextGroups: acc.contextGroups + chunk.stats.contextGroups,
          equalModifiedLinesGroups:
            acc.equalModifiedLinesGroups + chunk.stats.equalModifiedLinesGroups,
          normalisedCodeEqualGroups:
            acc.normalisedCodeEqualGroups +
            chunk.stats.normalisedCodeEqualGroups,
          remainingChangeGroupsAfterFilter:
            acc.remainingChangeGroupsAfterFilter +
            chunk.stats.remainingChangeGroupsAfterFilter,
        };
      },
      {
        totalGroups: 0,
        contextGroups: 0,
        equalModifiedLinesGroups: 0,
        normalisedCodeEqualGroups: 0,
        remainingChangeGroupsAfterFilter: 0,
      }
    );

    console.error(
      `[diff] file ${fileIndex + 1} cumulative stats`,
      cumulativeStats
    );

    // TODO: remove this basic match filter
    const filteredChunksBasicAllMatch = enrichedChunks.filter(
      (chunk, chunkIndex) => chunk.stats.remainingChangeGroupsAfterFilter > 0
    );

    // TODO: refactor the core logic of this map/filter into a helper function?
    // TODO: BUG: I think this currently doesn't update the Chunk's oldStart, oldLines, newStart, newLines values when we remove bits of the diff, making the patch metadata invalid
    //   See also:
    //     https://github.com/0xdevalias/chatgpt-source-watch/blob/main/scripts/fix-diff-headers.js
    //     https://github.com/0xdevalias/udio-source-watch/blob/main/scripts/fix-diff-headers.js
    const filteredChunks = enrichedChunks
      .map((chunk) => {
        // Filter out 'isNormalisedCodeEqual' entries from 'updatedGroupedChanges'
        const groupedChangesWithoutNormalizedEqual =
          chunk.updatedGroupedChanges.filter(
            (entry) => !entry.isNormalisedCodeEqual
          );

        // Further process to remove isolated 'isContextGroup' entries
        const groupedChangesWithoutNormalizedEqualOrIsolatedContextGroups =
          groupedChangesWithoutNormalizedEqual.reduce(
            (acc, current, index, array) => {
              const isIsolatedContextGroup =
                current.isContextGroup &&
                !(array[index - 1] && !array[index - 1].isContextGroup) &&
                !(array[index + 1] && !array[index + 1].isContextGroup);

              if (!isIsolatedContextGroup || !current.isContextGroup) {
                acc.push(current);
              }

              return acc;
            },
            []
          );

        return {
          ...chunk,
          filteredGroupedChanges:
            groupedChangesWithoutNormalizedEqualOrIsolatedContextGroups,
        };
      })
      .filter((chunk) => {
        // Filter out chunks that after processing are either empty or contain only context groups
        const hasMeaningfulChanges = chunk.filteredGroupedChanges.some(
          (group) => !group.isContextGroup
        );
        return chunk.filteredGroupedChanges.length > 0 && hasMeaningfulChanges;
      });

    // TODO: remove/reduce this debug logging?
    // console.error('count of diff chunks', {
    //   'file.chunks': file.chunks.length,
    //   'file.chunksChangeCount': file.chunks.map((chunk) => chunk.changes.length),
    //   enrichedChunks: enrichedChunks.length,
    //   enrichedChunksGroupCount: enrichedChunks.reduce(
    //     (total, chunk) => {
    //       return total + chunk.updatedGroupedChanges.length;
    //     },
    //     0
    //   ),
    //   filteredChunksBasicAllMatch: filteredChunksBasicAllMatch.length,
    //   filteredChunksBasicAllMatchGroupCount: filteredChunksBasicAllMatch.reduce(
    //     (total, chunk) => {
    //       return total + chunk.updatedGroupedChanges.length;
    //     },
    //     0
    //   ),
    //   filteredChunks: filteredChunks.length,
    //   filteredChunksGroupCount: filteredChunks.reduce(
    //     (total, chunk) => {
    //       return total + chunk.filteredGroupedChanges.length;
    //     },
    //     0
    //   ),
    // });
    // Helper function to sum up the lengths of updatedGroupedChanges or filteredGroupedChanges across chunks
    const sumGroupCounts = (chunks, key = 'updatedGroupedChanges') =>
      chunks.reduce((total, chunk) => total + (chunk[key] || []).length, 0);

    // Helper function to sum up the total change count within each group of a given chunk array
    const sumChangeCounts = (chunks, key = 'updatedGroupedChanges') =>
      chunks.reduce((totalChanges, chunk) => {
        const changesPerGroup = chunk[key] || [];
        return (
          totalChanges +
          changesPerGroup.reduce((sum, group) => sum + group.changes.length, 0)
        );
      }, 0);

    console.error('Count of diff chunks', {
      'file.chunks': file.chunks.length,
      'file.chunksChangeCount': file.chunks.reduce(
        (total, chunk) => total + chunk.changes.length,
        0
      ),
      enrichedChunks: enrichedChunks.length,
      enrichedChunksGroupCount: sumGroupCounts(enrichedChunks),
      enrichedChunksChangeCount: sumChangeCounts(enrichedChunks),
      filteredChunksBasicAllMatch: filteredChunksBasicAllMatch.length,
      filteredChunksBasicAllMatchGroupCount: sumGroupCounts(
        filteredChunksBasicAllMatch
      ),
      filteredChunksBasicAllMatchChangeCount: sumChangeCounts(
        filteredChunksBasicAllMatch
      ),
      filteredChunks: filteredChunks.length,
      filteredChunksGroupCount: sumGroupCounts(
        filteredChunks,
        'filteredGroupedChanges'
      ),
      filteredChunksChangeCount: sumChangeCounts(
        filteredChunks,
        'filteredGroupedChanges'
      ),
    });

    return {
      ...file,
      chunks: enrichedChunks,
      filteredChunks,
      cumulativeStats,
    };
  });

  // TODO: have this print out the diff for more than one file?
  const file = modifiedDiffFiles[0];
  // console.error(file)
  // TODO: The git diff header usually looks like this, we mimic it below, but is it correct for all cases?
  //   diff --git a/unpacked/_next/static/chunks/pages/_app.js b/unpacked/_next/static/chunks/pages/_app.js
  //   index a46f6d5..2695a4b 100644
  //   --- a/unpacked/_next/static/chunks/pages/_app.js
  //   +++ b/unpacked/_next/static/chunks/pages/_app.js
  console.log(`diff --git a/${file.from} b/${file.to}`);
  console.log(`index ${file.index.join(' ')}`);
  console.log(`--- a/${file.from}`);
  console.log(`+++ b/${file.to}`);
  file.filteredChunks.forEach((chunk) => {
    console.log(chunk.content);

    chunk.filteredGroupedChanges.forEach((group) => {
      group.changes.forEach((change) => {
        console.log(change.content);
      });
    });
  });

  ////////////////////////////////////////////
  // Below here is just hacky testing code
  ////////////////////////////////////////////
  if (DEBUG) {
    console.log('\n-------------\n');

    // The JavaScript code you want to parse
    const code1 = `i[e].call(n.exports, n, n.exports, b), (r = !1);`;
    const code2 = `s[e].call(n.exports, n, n.exports, p), (r = !1);`;

    const identifiers1 = Array.from(extractIdentifiersFromCode(code1));
    const identifiers2 = Array.from(extractIdentifiersFromCode(code2));

    const diffIdentifiers = diffArrays(
      identifiers1,
      identifiers2
      // {
      //   comparator: (left, right) => {}
      // },
    );

    console.log('extractIdentifiers:', {
      code1,
      code2,
      identifiers1,
      identifiers2,
      areEqual: new Set(identifiers1) === new Set(identifiers2),
    });

    console.log('diffIdentifiers', diffIdentifiers);

    const updatedCode1 = normalizeIdentifierNamesInCode(code1);
    const updatedCode2 = normalizeIdentifierNamesInCode(code2);

    console.log('normalizeIdentifiers:', {
      updatedCode1,
      updatedCode2,
      areEqual: updatedCode1 === updatedCode2,
    });

    /////////////////////////////

    customCodeDiff(code1, code2);
  }
}

/**
 * Groups the specified changes into arrays of related changes, directly associating type counts with each group,
 * while ensuring the code adheres to the DRY principle.
 *
 * @param changes Array of change objects.
 * @returns {Array} An array of objects, each containing a group of changes and the type counts for that group.
 */
function groupChunkChanges(changes) {
  return changes.reduce((acc, change) => {
    const lastGroup = acc.length > 0 ? acc[acc.length - 1] : null;
    const lastChange = lastGroup
      ? lastGroup.changes[lastGroup.changes.length - 1]
      : null;

    // Determine if the current change should be grouped with the last one
    const shouldGroupWithLast =
      lastChange &&
      (change.type === lastChange.type ||
        (change.type === 'add' && lastChange.type === 'del'));

    if (shouldGroupWithLast) {
      // Add the change to the last group and update its type count
      lastGroup.changes.push(change);
      lastGroup.typeCounts[change.type] =
        (lastGroup.typeCounts[change.type] || 0) + 1;
    } else {
      // Create a new group with the current change if there's no last group or the types don't match
      acc.push({
        changes: [change],
        typeCounts: { [change.type]: 1 },
        isContextGroup: false, // Initialized with false; will be updated below
        isEqualModifiedLinesCount: false, // Initialized with false; will be updated below
      });
    }

    // Update the flags for the group
    const group = acc[acc.length - 1];

    group.isContextGroup = group.changes.every(
      (change) => change.type === 'normal'
    );

    group.isEqualModifiedLinesCount =
      (group.typeCounts['add'] &&
        group.typeCounts['del'] &&
        group.typeCounts['add'] === group.typeCounts['del']) ||
      false;

    return acc;
  }, []);
}

function groupChunkChangesV2(chunk) {
  const { changes } = chunk;

  const typeCounts = changes.reduce(
    (acc, change) => ({
      ...acc,
      [change.type]: (acc[change.type] || 0) + 1,
    }),
    {}
  );

  const isContextGroup = changes.every((change) => change.type === 'normal');

  const isEqualModifiedLinesCount =
    (typeCounts['add'] &&
      typeCounts['del'] &&
      typeCounts['add'] === typeCounts['del']) ||
    false;

  const wholeChunkGroup = {
    changes,
    typeCounts,
    isContextGroup,
    isEqualModifiedLinesCount,
  };

  // console.error({ wholeChunkGroup, chunk, changes })

  return [wholeChunkGroup];
}

/**
 * Compares code differences after normalizing them, to assess if the normalized additions and deletions are equal.
 *
 * @param {Array} changes - An array of change objects.
 * @param {Object} errorContext - The context in which the error occurred.
 * @returns {Object} An object containing extracted, normalized code and a flag indicating if normalized codes are equal.
 */
function compareNormalizedCodeDiffs(changes, errorContext = {}) {
  const changesByType = changes.reduce((acc, change) => {
    const changeType = change.type;

    // const content = change.content.substring(1).trim(); // Extract content, trimming leading character
    const content = change.content.substring(1); // Extract content, trimming leading character (which is the diff type marker)

    acc[changeType] = acc[changeType] || [];
    acc[changeType].push(content); // Accumulate content by type

    return acc;
  }, {});

  const codeByType = {
    del: changesByType.del ? changesByType.del.join('\n') : '',
    add: changesByType.add ? changesByType.add.join('\n') : '',
  };

  // const normalisedCodeByType = {
  //   del: codeByType.del
  //     ? normalizeIdentifierNamesInCode(codeByType.del, errorContext)
  //     : codeByType.del,
  //   add: codeByType.add
  //     ? normalizeIdentifierNamesInCode(codeByType.add, errorContext)
  //     : codeByType.add,
  // };

  // const normalisedCodeByType = {
  //   del: codeByType.del
  //     ? normalizeIdentifierNamesInCodeV2(codeByType.del, errorContext)
  //     : codeByType.del,
  //   add: codeByType.add
  //     ? normalizeIdentifierNamesInCodeV2(codeByType.add, errorContext)
  //     : codeByType.add,
  // };

  let normalisedCodeByTypeV3;
  let normalisedCodeByType = {
    del: codeByType.del,
    add: codeByType.add,
  };
  if (codeByType.del && codeByType.add) {
    normalisedCodeByTypeV3 = {
      del: normalizeIdentifierNamesInCodeV3(codeByType.del, errorContext),
      add: normalizeIdentifierNamesInCodeV3(codeByType.add, errorContext),
    };
    normalisedCodeByType = {
      del: normalisedCodeByTypeV3.del.mappedTokensString,
      add: normalisedCodeByTypeV3.add.mappedTokensString,
    };
  }

  const isNormalisedCodeEqual =
    (normalisedCodeByType.del &&
      normalisedCodeByType.add &&
      normalisedCodeByType.del === normalisedCodeByType.add) ||
    false;

  // TODO: remove this debug logging
  if (normalisedCodeByTypeV3) {
    if (codeByType.del && codeByType.add && !isNormalisedCodeEqual) {
      // Calculate a minimal diff of the un-joined changesByType arrays, after normalisation
      // TODO: If we stick with the normalizeIdentifierNamesInCodeV3 tokenisation method, we could do this
      //   before even joining the arrays together for comparison (if we even need to bother joining
      //   them anymore when we refactor this code to create a minimal set of changes after normalisation?)
      const normalisedDels = changesByType.del.map(
        (code) =>
          normalizeIdentifierNamesInCodeV3(code, errorContext)
            .mappedTokensString
      );
      const normalisedAdds = changesByType.add.map(
        (code) =>
          normalizeIdentifierNamesInCodeV3(code, errorContext)
            .mappedTokensString
      );
      const arrayDiff = diffArrays(normalisedDels, normalisedAdds);

      console.error('[compareNormalizedCodeDiffs]', {
        changesByType,
        codeByType,
        normalisedCodeByType,
        isNormalisedCodeEqual,
        normalisedCodeByTypeV3,
        delIdentifierMap: normalisedCodeByTypeV3.del.identifierMap,
        addIdentifierMap: normalisedCodeByTypeV3.add.identifierMap,
      });
      console.error('[compareNormalizedCodeDiffs::arrayDiff]', arrayDiff);
      // console.error(
      //   '[compareNormalizedCodeDiffs::arrayDiffValues]',
      //   arrayDiff.map((d) => d.value)
      // );

      // TODO: Figure out how to use the results of arrayDiff to minimise the lines of changes we return for
      //  this group, to just the ones that have actually changed after identifiers are normalised
      // TODO: explore whether we can simplify the code for doing this by changing the comparator function used
      //   by arrayDiff (or another of the jsDiff diff functions)
    }
  }

  return {
    changesByType,
    codeByType,
    normalisedCodeByType,
    isNormalisedCodeEqual,
  };
}

// TODO: I'm not sure if this function works properly at the moment.. as when I use it,
//  I get much smaller/weirder results than with the original
// TODO: I think that's because we're including normal content in both added/deleted
//   which means it gets isNormalisedCodeEqual set to true for context chunks,
//   which I believe will then be filtered out at the end.
//   When we comment out case 'normal', it gets the same result as the previous method, which is what we would expect
// TODO: realistically we probably only want to do it this way if we were including context within the
//  chunk groups alongside added/deleted; which we're not currently doing in our main/normal way
function compareNormalizedCodeDiffsV2(changes, errorContext = {}) {
  const changesByType = changes.reduce(
    (acc, change) => {
      const content = change.content.substring(1); // Extract content, trimming leading character (which is the diff type marker)

      switch (change.type) {
        case 'normal':
          console.log('normal content', content);
          acc.del.push(content);
          acc.add.push(content);
          break;
        case 'del':
          acc.del.push(content);
          break;
        case 'add':
          acc.add.push(content);
          break;
      }

      return acc;
    },
    {
      del: [],
      add: [],
    }
  );

  const codeByType = {
    del: changesByType.del ? changesByType.del.join('\n') : '',
    add: changesByType.add ? changesByType.add.join('\n') : '',
  };

  // const normalisedCodeByType = {
  //   del: codeByType.del
  //     ? normalizeIdentifierNamesInCode(codeByType.del, errorContext)
  //     : codeByType.del,
  //   add: codeByType.add
  //     ? normalizeIdentifierNamesInCode(codeByType.add, errorContext)
  //     : codeByType.add,
  // };

  const normalisedCodeByType = {
    del: codeByType.del
      ? normalizeIdentifierNamesInCodeV2(codeByType.del, errorContext)
      : codeByType.del,
    add: codeByType.add
      ? normalizeIdentifierNamesInCodeV2(codeByType.add, errorContext)
      : codeByType.add,
  };

  const isNormalisedCodeEqual =
    (normalisedCodeByType.del &&
      normalisedCodeByType.add &&
      normalisedCodeByType.del === normalisedCodeByType.add) ||
    false;

  return {
    changesByType,
    codeByType,
    normalisedCodeByType,
    isNormalisedCodeEqual,
  };
}

/**
 * Prepares the specified code for parsing by the AST parser by making minor fixes to prevent parsing errors.
 *
 * This is designed for assisting with parsing code snippets, not entire files.
 *
 * @param {string} code - The code to prepare for AST parsing.
 * @returns {string} The prepared code.
 *
 * @TODO Figure out how to fix the following:
 *   - if statements that are missing their body
 *   - Partial object members that are missing their 'wrapper object'
 *   - Partial ternary expressions that are missing their 'foo ?' but have their 'bar : baz'
 *   - 'else' / 'else if' statements that are missing their 'if' condition
 *   - 'case:' statements that are missing their 'switch' condition
 */
function prepareCodeForASTParsing(code) {
  let updatedCode = code;

  // Remove newlines from code and collapse excess whitespace
  // updatedCode = updatedCode.replace(/[\r\n]+/g, '');
  updatedCode = updatedCode
    .replace(/[\r\n]+/g, ' ') // Replace newlines with a single space
    .replace(/\s\s+/g, ' ') // Collapse multiple spaces into one
    .trim(); // Trim leading and trailing whitespace

  // Fix members with missing left-hand side
  if (updatedCode.trimStart().startsWith('.')) {
    updatedCode = `FOO${updatedCode.trimStart()}`;
  }

  // TODO: Ternaries can currently fail when they need brackets balanced within them, eg:
  //   code: '                ? (en && "number" != typeof en && lM(Y, et, en)',
  //   preparedCode: 'true ? (en && "number" != typeof en && lM(Y, et, en) : false)'

  // Fix ternaries with missing left/right-hand sides
  if (updatedCode.trimStart().startsWith('?') && !updatedCode.includes(':')) {
    updatedCode = `true ${updatedCode.trimStart()} : false`;
  }

  // Fix ternaries with missing left-hand side
  // TODO: need to figure how to detect ternaries that are missing left-hand side but don't start with '?' as well
  if (updatedCode.trimStart().startsWith('?')) {
    updatedCode = `true ${updatedCode.trimStart()}`;
  }

  // Fix colons with missing left-hand side
  if (updatedCode.trimStart().startsWith(':')) {
    updatedCode = updatedCode.trimStart().slice(1);
  }

  // Fix 'else if' statements with missing body
  // TODO: Not sure if this works currently, it didn't seem to improve our parsing error count
  // if (
  //   (updatedCode.trimStart().startsWith('else if') ||
  //     updatedCode.trimStart().startsWith('} else if')) &&
  //   !updatedCode.includes('{')
  // ) {
  //   updatedCode = `${updatedCode.trimEnd()} {}`;
  // }

  // Fix 'else if' statements with missing 'if'
  if (updatedCode.trimStart().startsWith('else if')) {
    updatedCode = `if (true) {} ${updatedCode.trimStart()}`;
  }
  if (updatedCode.trimStart().startsWith('} else if')) {
    updatedCode = `if (true) { ${updatedCode.trimStart()}`;
  }

  // Fix 'if' statements with missing body
  if (updatedCode.trimStart().startsWith('if') && !updatedCode.includes('{')) {
    updatedCode = `${updatedCode} {}`;
  }

  // Fix 'case' statements with missing 'switch'
  if (
    updatedCode.trimStart().startsWith('case') &&
    !updatedCode.includes('switch')
  ) {
    updatedCode = `switch (true) { ${updatedCode.trim()} }`;
  }

  // Fix 'for' statements with missing body
  if (updatedCode.trimStart().startsWith('for') && !updatedCode.includes('{')) {
    updatedCode = `${updatedCode.trimEnd()} {}`;
  }

  // Remove the last character if it's a comma
  if (updatedCode.trimEnd().endsWith(',')) {
    updatedCode = updatedCode.trimEnd().slice(0, -1);
  }

  // Fix expressions with missing right-hand side
  if (
    updatedCode.trimEnd().endsWith('&&') ||
    updatedCode.trimEnd().endsWith('||') ||
    updatedCode.trimEnd().endsWith('=') ||
    updatedCode.trimEnd().endsWith('+') ||
    updatedCode.trimEnd().endsWith('-') ||
    updatedCode.trimEnd().endsWith('*') ||
    updatedCode.trimEnd().endsWith('/')
  ) {
    updatedCode = `${updatedCode} true`;
  }

  // Fix partial object updates
  // TODO: This isn't perfect, but it seems to work for at least some cases
  const objectPropertyPattern = /\w+:\s*[\w().]+,?/;
  if (
    objectPropertyPattern.test(updatedCode) &&
    !updatedCode.includes('{') &&
    !updatedCode.includes('}')
  ) {
    updatedCode = `{${updatedCode.trim()}}`;
  }

  // Fix objects with missing right-hand side
  if (
    updatedCode.trimStart().startsWith('{') &&
    updatedCode.trimEnd().endsWith('}')
  ) {
    updatedCode = `const FOO = ${updatedCode.trimStart()}`;
  }

  updatedCode = balanceBracesAndParentheses(updatedCode);

  return updatedCode;
}

/**
 * Prepares the specified code for parsing by the AST parser by making minor fixes to prevent parsing errors.
 *
 * This is designed for assisting with parsing code snippets, not entire files.
 *
 * @param {string} code - The code to prepare for AST parsing.
 * @param {Object} errorContext - The context in which the error occurred.
 * @returns {string} The prepared code.
 */
function prepareCodeForASTParsingV2(code, errorContext = {}) {
  let preProcessedCode = prepareCodeForASTParsingV2PreProcess(code);

  try {
    let ast;
    // try {
    // Parse the code into an AST using acornLoose's error tolerant parser
    ast = acornLoose.parse(preProcessedCode, { ecmaVersion: "latest" });
    // ast = acornLoose.parse(preProcessedCode, { ecmaVersion: "latest", sourceType: "module" });
    // } catch (err) {
    //   // Hacky workaround to attempt to catch more complex ternary cases
    //   console.error(
    //     'Try hacky workaround to attempt to catch more complex ternary cases'
    //   );
    //   preProcessedCode = `${preProcessedCode} : false`;
    //   ast = acornLoose.parse(preProcessedCode, { ecmaVersion: 2020 });
    // }

    // Filter the AST to remove acornLoose's dummy nodes
    // TODO: add a proper fix for ternaries here
    //  ConditionalExpression with the alternate set to an Identifier that isDummy
    // const filteredAst = estraverse.replace(ast, {
    //   enter: (node, parent) => {
    //     if (acornLoose.isDummy(node)) {
    //       return estraverse.VisitorOption.Remove;
    //     }
    //   },
    // });

    const filteredAst = estraverse.replace(ast, {
      enter: (node, parent) => {
        // Attempt to fix broken ternaries
        if (node.type === 'ConditionalExpression') {
          // Fix ternaries like: foo ? [MISSING] : baz
          if (acornLoose.isDummy(node.consequent)) {
            return {
              ...node,
              consequent: {
                type: 'Literal',
                value: null,
                raw: 'null',
              },
            };
          }

          // Fix ternaries like: foo ? bar[MISSING]
          if (acornLoose.isDummy(node.alternate)) {
            return {
              ...node, // Spread the original node to copy its properties
              alternate: {
                type: 'Literal',
                value: null,
                raw: 'null',
              },
            };
          }
        }

        // Attempt to fix object members with missing wrapper object
        // TODO: I think this should work for something like this:
        //     H: "foo",
        //   But maybe not for something like this:
        //     H: "foo", J: "bar,
        //   As the second one seems to parse as a LabeledStatement followed by an ExpressionStatement
        //   I haven't tried nor deeply explored the following code to see if/how well it would work.
        //     const estraverse = require('estraverse');
        //     const escodegen = require('escodegen');
        //
        //     let isCollecting = false;
        //     let collectedNodes = [];
        //     let startIndex = -1;
        //
        //     const transformedAst = estraverse.replace(ast, {
        //       enter: (node, parent, currentIndex) => {
        //         if (node.type === 'LabeledStatement' && parent.type === 'Program' && !isCollecting) {
        //           // Start collecting nodes from LabeledStatement
        //           isCollecting = true;
        //           collectedNodes.push(node);
        //           startIndex = currentIndex;
        //           this.skip(); // Skip further traversal into this node
        //         } else if (isCollecting && (node.type === 'ExpressionStatement' || node.type === 'LabeledStatement')) {
        //           // Continue collecting if following nodes are ExpressionStatement or LabeledStatement
        //           collectedNodes.push(node);
        //           this.skip(); // Skip further traversal into this node
        //         } else if (isCollecting) {
        //           // Once collecting is done, transform the collected nodes
        //           let objectExpression = {
        //             type: 'ObjectExpression',
        //             properties: collectedNodes.map((collectedNode) => {
        //               if (collectedNode.type === 'LabeledStatement') {
        //                 return {
        //                   type: 'Property',
        //                   key: collectedNode.label,
        //                   value: collectedNode.body, // body is an ExpressionStatement; might need adjustment
        //                   kind: 'init'
        //                 };
        //               } else {
        //                 // Handle ExpressionStatement or other node types
        //                 // This part might need customization based on actual node structure
        //               }
        //             })
        //           };
        //
        //           // Wrap the ObjectExpression in a VariableDeclaration
        //           let variableDeclaration = {
        //             type: 'VariableDeclaration',
        //             declarations: [{
        //               type: 'VariableDeclarator',
        //               id: { type: 'Identifier', name: 'foo' }, // Customize the variable name as needed
        //               init: objectExpression
        //             }],
        //             kind: 'const'
        //           };
        //
        //           // Reset collecting state
        //           isCollecting = false;
        //           collectedNodes = [];
        //
        //           // Replace the sequence in the parent node (Program) with the new variable declaration
        //           if (startIndex !== -1 && parent.type === 'Program') {
        //             parent.body.splice(startIndex, collectedNodes.length, variableDeclaration);
        //           }
        //
        //           return estraverse.VisitorOption.Remove; // Remove the original nodes
        //         }
        //       }
        //     });
        // TODO: this is the simpler one, but it also seemed to increase the number of mismatches we had, so it might not be good enough
        // if (node.type === 'LabeledStatement' && parent.type === 'Program') {
        //   return {
        //     type: 'VariableDeclaration',
        //     declarations: [
        //       {
        //         type: 'VariableDeclarator',
        //         id: { type: 'Identifier', name: 'foo' },
        //         init: {
        //           type: 'ObjectExpression',
        //           properties: [
        //             {
        //               type: 'Property',
        //               key: { type: 'Identifier', name: node.label.name },
        //               computed: false,
        //               value: node.body.expression,
        //               kind: 'init',
        //               method: false,
        //               shorthand: false,
        //               decorators: null
        //             }
        //           ]
        //         }
        //       }
        //     ],
        //     kind: 'const'
        //   };
        // }

        // Default action for handling dummy nodes outside specific structures
        if (acornLoose.isDummy(node)) {
          return estraverse.VisitorOption.Remove;
        }
      },
    });

    const processedCode = escodegen.generate(filteredAst);

    // const postProcessedCode = prepareCodeForASTParsingV2PostProcess(preparedCode);
    const postProcessedCode = processedCode;

    return postProcessedCode;
  } catch (error) {
    const postProcessedCode =
      prepareCodeForASTParsingV2PostProcess(preProcessedCode);

    console.warn(
      '[diff::prepareCodeForASTParsingV2] error while trying to prepare code for main AST parsing, falling back to alternative prep method',
      {
        error,
        errorContext,
        code,
        preProcessedCode,
        postProcessedCode,
      }
    );

    return postProcessedCode;
  }
}

/**
 * Function to continuously remove matching substrings from the start till there are no more matches.
 *
 * @param {string} originalString The original string to process.
 * @param {string[]} substringsToRemove An array of substrings to remove from the start.
 * @returns {string} The processed string with the specified substrings removed from the start.
 */
function removeAllSubstringsFromStart(originalString, substringsToRemove) {
  let resultString = originalString;
  let wasModified;

  do {
    wasModified = false; // Reset flag for each pass

    for (const substring of substringsToRemove) {
      if (resultString.trimStart().startsWith(substring)) {
        // Calculate the position to slice to
        const startIndex = substring.length;
        resultString = resultString.trimStart().slice(startIndex).trimStart();
        wasModified = true; // Indicate a modification was made
      }
    }
  } while (wasModified); // Continue if any modifications were made

  return resultString;
}

/**
 * Function to continuously remove matching substrings from the end till there are no more matches
 *
 * @param {string} originalString
 * @param {string[]} substringsToRemove
 * @returns {string}
 */
function removeAllSubstringsFromEnd(originalString, substringsToRemove) {
  let resultString = originalString;
  let wasModified;

  do {
    wasModified = false; // Reset flag for each pass

    for (const substring of substringsToRemove) {
      if (resultString.trimEnd().endsWith(substring)) {
        // Calculate the position to slice from
        const endIndex = resultString.trimEnd().lastIndexOf(substring);
        resultString = resultString.slice(0, endIndex).trimEnd();
        wasModified = true; // Indicate a modification was made
      }
    }
  } while (wasModified); // Continue if any modifications were made

  return resultString;
}

function prepareCodeForASTParsingV2PreProcess(code) {
  // Remove newlines from code and collapse excess whitespace
  let updatedCode = code
    .replace(/[\r\n]+/g, ' ') // Replace newlines with a single space
    .replace(/\s\s+/g, ' ') // Collapse multiple spaces into one
    .trim(); // Trim leading and trailing whitespace

  // Remove leading problematic prefixes
  updatedCode = removeAllSubstringsFromStart(updatedCode, [
    ']',
    `}`,
    `)`,
    'return',
    '&&',
    '||',
    ':',
  ]);

  // Remove trailing problematic suffixes
  updatedCode = removeAllSubstringsFromEnd(updatedCode, [
    ',',
    '&&',
    '||',
    '=',
    '+',
    '-',
    '*',
    '/',
    '!!(',
    '[',
    '=>',
  ]);

  // Fix member expressions with missing left-hand side
  if (updatedCode.startsWith('.')) {
    updatedCode = `FOO${updatedCode}`;
  }

  if (updatedCode.startsWith('?') && !updatedCode.includes(':')) {
    updatedCode = updatedCode.slice(1);
  }
  if (updatedCode.startsWith('?') && updatedCode.includes(':')) {
    updatedCode = updatedCode
      .slice(1)
      .replaceAll(':', ',')
      .replaceAll('?', ',');
  }

  // Fix destructuring assignment without variable type
  if (/^\{[^:]+:[^}]+}\s*=/.test(updatedCode)) {
    updatedCode = `const ${updatedCode}`;
  }

  updatedCode = balanceBracesAndParentheses(updatedCode);

  return updatedCode;
}

/**
 * Prepares the specified code for parsing by the AST parser by making minor fixes to prevent parsing errors.
 *
 * This is designed for assisting with parsing code snippets, not entire files.
 *
 * @param {string} code - The code to prepare for AST parsing.
 * @returns {string} The prepared code.
 *
 * @TODO Figure out how to fix the following:
 *   - Nested ternaries
 *       code        : '? ((eM = e_), ed(e_) ? (eM = ew(e_)) : (!eg(e_) || em(e_)) && (eM = ec(ej)))'
 *       preparedCode: 'true ? ((eM = e_), ed(e_) ? (eM = ew(e_)) : (!eg(e_) || em(e_)) && (eM = ec(ej)))'
 *   - Object destructuring
 *       code        : '{ cancelRef: eo } = tM(tR, en),',
 *       preparedCode: '{ cancelRef: eo } = tM(tR, en)',
 *  - Partial object members that are missing their 'wrapper object'
 *       code        : 'H: function () {\n          return eG;\n        },',
 *       preparedCode: 'H: function () { return eG; } ;',
 *  - Strip leading closing brackets/etc
 *       code        : '})) || void 0 === eO',
 *       preparedCode: '{((})) || void 0 === eO',
 */
function prepareCodeForASTParsingV2PostProcess(code) {
  // Remove newlines from code and collapse excess whitespace
  let updatedCode = code
    .replace(/[\r\n]+/g, ' ') // Replace newlines with a single space
    .replace(/\s\s+/g, ' ') // Collapse multiple spaces into one
    .trim(); // Trim leading and trailing whitespace

  // Fix member expressions with missing left-hand side
  if (updatedCode.trimStart().startsWith('.')) {
    updatedCode = `FOO${updatedCode.trimStart()}`;
  }

  // Fix ternaries with missing left/right-hand sides
  // TODO: need to figure how to detect ternaries that are missing left-hand side but don't start with '?' as well
  if (updatedCode.trimStart().startsWith('?')) {
    let tempCode = updatedCode.trim().slice(1);
    tempCode = balanceBracesAndParentheses(tempCode);

    updatedCode = `true ? ${tempCode}`;

    // Fix ternaries with missing right-hand side
    // TODO: I think this would work better if it had closing brackets/etc balanced before adding the suffix
    if (!updatedCode.includes(':')) {
      updatedCode = `${updatedCode.trimEnd()} : false`;
    }
  }

  // // Simplify expressions with missing left-hand side
  // if (updatedCode.trimStart().startsWith('?')) {
  //   updatedCode = updatedCode.trimStart().slice(1);
  // }

  // Fix standalone 'return' statement
  if (updatedCode.trimStart().startsWith('return')) {
    updatedCode = updatedCode.trimStart().slice(6);
  }

  // Fix colons with missing left-hand side
  if (updatedCode.trimStart().startsWith(':')) {
    updatedCode = updatedCode.trimStart().slice(1);
  }

  // Remove the last character if it's a comma
  if (updatedCode.trimEnd().endsWith(',')) {
    updatedCode = updatedCode.trimEnd().slice(0, -1);
  }

  // Fix expressions with missing right-hand side
  if (
    updatedCode.trimEnd().endsWith('&&') ||
    updatedCode.trimEnd().endsWith('||') ||
    updatedCode.trimEnd().endsWith('=') ||
    updatedCode.trimEnd().endsWith('+') ||
    updatedCode.trimEnd().endsWith('-') ||
    updatedCode.trimEnd().endsWith('*') ||
    updatedCode.trimEnd().endsWith('/') ||
    updatedCode.trimEnd().endsWith('!!(')
  ) {
    updatedCode = `${updatedCode} true`;
  }
  if (updatedCode.trimEnd().endsWith('[')) {
    updatedCode = `${updatedCode}FOO]`;
  }

  updatedCode = balanceBracesAndParentheses(updatedCode);

  return updatedCode;
}

// /**
//  * Balances the number of opening and closing braces and parentheses in a given code string.
//  *
//  * @param {string} code - The source code to balance.
//  * @returns {string} The balanced source code.
//  *
//  * @TODO Figure out how to make this balance the brackets in a logical order, not just any random order
//  */
// function balanceBracesAndParenthesesLegacy(code) {
//   let openBracesCount = 0;
//   let closeBracesCount = 0;
//   let openParenthesesCount = 0;
//   let closeParenthesesCount = 0;
//
//   // Count the number of opening and closing braces and parentheses
//   for (const char of code) {
//     if (char === '{') openBracesCount++;
//     if (char === '}') closeBracesCount++;
//     if (char === '(') openParenthesesCount++;
//     if (char === ')') closeParenthesesCount++;
//   }
//
//   // TODO: Apparently this regex method is faster than the above loop (on the better benchmarking sites at least..)
//   //   https://jsbench.me/
//   //     for ... of ...: 2.4M ops/s ± 2.9% (20.1 % slower)
//   //     regex: 3.1M ops/s ± 1.78% (Fastest)
//   //   https://perf.link/#eyJpZCI6ImxkY3JraWhlNzVrIiwidGl0bGUiOiJDb3VudGluZyBicmFjZXMvcGFyZW50aGVzZXMvZXRjIiwiYmVmb3JlIjoiY29uc3QgdXBkYXRlZENvZGUgPSAnaVtlXS5jYWxsKG4uZXhwb3J0cywgbiwgbi5leHBvcnRzLCBiKSwgKHIgPSAhMSk7JyIsInRlc3RzIjpbeyJuYW1lIjoiZm9yIC4uLiBvZiAuLi4iLCJjb2RlIjoiICBsZXQgb3BlbkJyYWNlc0NvdW50ID0gMDtcbiAgbGV0IGNsb3NlQnJhY2VzQ291bnQgPSAwO1xuICBsZXQgb3BlblBhcmVudGhlc2VzQ291bnQgPSAwO1xuICBsZXQgY2xvc2VQYXJlbnRoZXNlc0NvdW50ID0gMDtcblxuICAvLyBDb3VudCB0aGUgbnVtYmVyIG9mIG9wZW5pbmcgYW5kIGNsb3NpbmcgYnJhY2VzIGFuZCBwYXJlbnRoZXNlc1xuICBmb3IgKGNvbnN0IGNoYXIgb2YgdXBkYXRlZENvZGUpIHtcbiAgICBpZiAoY2hhciA9PT0gXCJ7XCIpIG9wZW5CcmFjZXNDb3VudCsrO1xuICAgIGlmIChjaGFyID09PSBcIn1cIikgY2xvc2VCcmFjZXNDb3VudCsrO1xuICAgIGlmIChjaGFyID09PSBcIihcIikgb3BlblBhcmVudGhlc2VzQ291bnQrKztcbiAgICBpZiAoY2hhciA9PT0gXCIpXCIpIGNsb3NlUGFyZW50aGVzZXNDb3VudCsrO1xuICB9IiwicnVucyI6WzM1MDAwLDkwMDAwLDEzMDAwLDk4MDAwLDMyMDAwLDYzMDAwLDE2NzAwMCw4NjAwMCwxODAwMCwxMzAwMCwxMjgwMDAsMTIxMDAwLDc3MDAwLDE0NDAwMCwxMDAwLDcxMDAwLDI0ODAwMCwyMzYwMDAsOTUwMDAsMTczMDAwLDIyMDAwLDU1MDAwLDEyNTAwMCw4NDAwMCwxMjQwMDAsMzkwMDAsNTEwMDAsMTQwMDAwLDMyMDAwLDExMjAwMCw0NDAwMCw2MzAwMCwxMjQwMDAsMTEwMDAsMTQwMDAsMjcwMDAsMzEwMDAsMjQwMDAsMjEwMDAsMTAyMDAwLDUzMDAwLDM0MjAwMCwzNDEwMDAsMjgxMDAwLDk5MDAwLDMzMDAwLDE1NjAwMCwxNzcwMDAsMTgwMDAsNTEwMDAsMjQwMDAsMTYwMDAwLDE1MzAwMCw1NzAwMCw4MDAwMCwzMTUwMDAsMjIzMDAwLDcwMDAwLDcwMDAwLDg3MDAwLDE4MTAwMCwxOTAwMDAsMzcwMDAsOTAwMCw1MzAwMCwxMjQwMDAsMjE5MDAwLDk0MDAwLDM5MDAwLDMyMDAwLDM5MDAwLDIzMDAwLDM5MDAwLDkwMDAwLDM5MDAwLDQ1MDAwLDM5MDAwLDM5MDAwLDE4NjAwMCw2NDAwMCwyMjAwMCwzNTAwMCw0NTAwMCwxMzgwMDAsMTI2MDAwLDI4MDAwLDM3MDAwLDE0NDAwMCwyMDAwLDE1MjAwMCw0NzAwMCwxMDAwLDM3MDAwLDQ3MDAwLDEzNjAwMCwyNDAwMCw0NzAwMCw3OTAwMCw0MjAwMCwxMjIwMDBdLCJvcHMiOjg4MzYwfSx7Im5hbWUiOiJyZWdleCIsImNvZGUiOiJjb25zdCBvcGVuQnJhY2VzQ291bnQgPSAodXBkYXRlZENvZGUubWF0Y2goL3svZykgfHwgW10pLmxlbmd0aDtcbmNvbnN0IGNsb3NlQnJhY2VzQ291bnQgPSAodXBkYXRlZENvZGUubWF0Y2goL30vZykgfHwgW10pLmxlbmd0aDtcbmNvbnN0IG9wZW5QYXJlbnRoZXNlc0NvdW50ID0gKHVwZGF0ZWRDb2RlLm1hdGNoKC9cXCgvZykgfHwgW10pLmxlbmd0aDtcbmNvbnN0IGNsb3NlUGFyZW50aGVzZXNDb3VudCA9ICh1cGRhdGVkQ29kZS5tYXRjaCgvXFwpL2cpIHx8IFtdKS5sZW5ndGg7IiwicnVucyI6WzgyODAwMCwxMjgwMDAsMTkzMDAwLDQyNjAwMCw3MjQwMDAsMzk1MDAwLDc4MjAwMCw1NTkwMDAsMjUwMDAwLDIxNTAwMCw3MzUwMDAsNzE1MDAwLDM5NDAwMCwzNzUwMDAsMTgyMDAwLDE0OTAwMCw3OTYwMDAsMjQzMDAwLDEzNjAwMCw4NjcwMDAsNzQ4MDAwLDcyMTAwMCw4NjcwMDAsNDgwMDAwLDQ3MzAwMCw3ODYwMDAsNzI0MDAwLDU0MTAwMCw2NjAwMCwyMjUwMDAsMzAxMDAwLDE0MDAwMCw2MDIwMDAsNjA5MDAwLDc1NDAwMCw2MzIwMDAsOTAwMDAsNjU4MDAwLDE4MjAwMCw0NjQwMDAsMTE4MDAwLDgyNjAwMCw4NzMwMDAsNzMxMDAwLDQ1ODAwMCwzMTcwMDAsNDczMDAwLDczNzAwMCw2OTkwMDAsOTYwMDAsNDMwMDAsNjU2MDAwLDg4MTAwMCwxMjAwMCw1NjUwMDAsMTAzMzAwMCw3MTMwMDAsMTAwMCwxNDQwMDAsNzM1MDAwLDEwMDAsMzMzMDAwLDIzNjAwMCwzOTgwMDAsNTcwMDAwLDMxMjAwMCw4NjcwMDAsMjUxMDAwLDM5OTAwMCw2NTYwMDAsMTAwMCw1MjUwMDAsNzIzMDAwLDgzOTAwMCw2OTkwMDAsMzY0MDAwLDg2ODAwMCw4NjEwMDAsMTE5MDAwLDM2MTAwMCw3OTYwMDAsMTIzMDAwLDEyMDAwLDc2NjAwMCw4OTcwMDAsMzEwMDAsMjMwMDAwLDU4OTAwMCw2NjcwMDAsNTgwMDAwLDI0OTAwMCw0NjMwMDAsNTMyMDAwLDEyODAwMCw0NjkwMDAsOTE0MDAwLDIwNDAwMCw0NTIwMDAsNTcwMDAwLDM2NzAwMF0sIm9wcyI6NDc2ODgwfV0sInVwZGF0ZWQiOiIyMDI0LTAxLTMxVDIxOjQ2OjE1LjUzNloifQ%3D%3D
//   //     for ... of ...: 18%
//   //     regex: 100%
//   //   https://jsben.ch/mVOoT
//   //     for ... of ... (2721654) (Fastest)
//   //     regex (2445967) (Slower)
//   // const openBracesCount = (updatedCode.match(/{/g) || []).length;
//   // const closeBracesCount = (updatedCode.match(/}/g) || []).length;
//   // const openParenthesesCount = (updatedCode.match(/\(/g) || []).length;
//   // const closeParenthesesCount = (updatedCode.match(/\)/g) || []).length;
//
//   // Calculate the difference to find unmatched symbols
//   const missingOpeningBraces = Math.max(0, closeBracesCount - openBracesCount);
//   const missingClosingBraces = Math.max(0, openBracesCount - closeBracesCount);
//   const missingOpeningParentheses = Math.max(
//     0,
//     closeParenthesesCount - openParenthesesCount
//   );
//   const missingClosingParentheses = Math.max(
//     0,
//     openParenthesesCount - closeParenthesesCount
//   );
//
//   // Prepare the corrected opening and closing symbols
//   const correctedOpeningSymbols =
//     '{'.repeat(missingOpeningBraces) + '('.repeat(missingOpeningParentheses);
//   const correctedClosingSymbols =
//     '}'.repeat(missingClosingBraces) + ')'.repeat(missingClosingParentheses);
//
//   // Apply the corrections to the code
//   return correctedOpeningSymbols + code + correctedClosingSymbols;
// }

/**
 * Balances the number of opening and closing braces and parentheses in a given code string.
 *
 * @param {string} code - The source code to balance.
 * @returns {string} The balanced source code.
 */
function balanceBracesAndParentheses(code) {
  let stack = [];
  let prependString = ''; // String to prepend to expr to balance leading closing brackets

  // Traversing the Expression
  for (let i = 0; i < code.length; i++) {
    let x = code[i];

    if (x === '(' || x === '[' || x === '{') {
      stack.push(x);
    } else if (x === ')' || x === ']' || x === '}') {
      if (stack.length === 0) {
        // Handle leading unbalanced closing brackets by prepending matching opening brackets
        switch (x) {
          case ')':
            prependString = '(' + prependString;
            break;
          case ']':
            prependString = '[' + prependString;
            break;
          case '}':
            prependString = '{' + prependString;
            break;
        }
        continue; // Continue without popping from an empty stack
      }

      let check;
      switch (x) {
        case ')':
          check = stack.pop();
          if (check !== '(') return code; // Unbalanced and cannot be fixed by appending/prepending
          break;

        case ']':
          check = stack.pop();
          if (check !== '[') return code; // Unbalanced and cannot be fixed by appending/prepending
          break;

        case '}':
          check = stack.pop();
          if (check !== '{') return code; // Unbalanced and cannot be fixed by appending/prepending
          break;
      }
    }
  }

  // Append necessary closing brackets based on what's left in the stack
  while (stack.length > 0) {
    let openBracket = stack.pop();
    switch (openBracket) {
      case '(':
        code += ')';
        break;
      case '[':
        code += ']';
        break;
      case '{':
        code += '}';
        break;
    }
  }

  return prependString + code; // Prepend opening brackets to balance leading closing brackets
}

/**
 * Parses the provided code into an Abstract Syntax Tree (AST).
 *
 * @param {string} code - The code to parse.
 * @returns {Object} The parsed AST.
 *
 * @see https://babeljs.io/docs/babel-parser#options
 */
function parseCodeToAST(code) {
  // try {
  return parser.parse(code, {
    sourceType: 'module',
    errorRecovery: true,
  });
  // } catch (err) {
  //   // Hacky workaround to attempt to catch more complex ternary cases
  //   const hackyCodeFix = `${code} : false`;
  //   console.error(
  //     'Try hacky workaround to attempt to catch more complex ternary cases',
  //     { code, hackyCodeFix }
  //   );
  //
  //   return parser.parse(hackyCodeFix, {
  //     sourceType: 'module',
  //     errorRecovery: true,
  //   });
  // }
}

/**
 * Normalizes the specified code to stabilize symbol names.
 *
 * @param {string} code - The source code to normalize.
 * @param {object} errorContext - The context in which the error occurred.
 * @returns {string} The normalized source code.
 */
function normalizeIdentifierNamesInCode(code, errorContext = {}) {
  // const prePreparedCode = prepareCodeForASTParsingV2(code, errorContext);
  // const preparedCode = prepareCodeForASTParsing(prePreparedCode);

  // const prePreparedCode = prepareCodeForASTParsing(code);
  // const preparedCode = prepareCodeForASTParsingV2(prePreparedCode, errorContext)

  const prePreparedCode = null;
  const preparedCode = prepareCodeForASTParsingV2(code, errorContext);

  try {
    const ast = parseCodeToAST(preparedCode);

    let identifierCounter = 1;
    const identifierMap = new Map();

    traverse(ast, {
      Identifier(path) {
        if (!identifierMap.has(path.node.name)) {
          identifierMap.set(path.node.name, `symbol${identifierCounter++}`);
        }
        path.node.name = identifierMap.get(path.node.name);
      },
    });

    // https://babeljs.io/docs/babel-generator#options
    const { code: generatedCode } = generator(ast, {}, code);

    return generatedCode;
  } catch (err) {
    console.warn(
      '[diff::normalizeIdentifierNamesInCode] error while trying to parse code into AST, continuing with un-normalised code',
      {
        err,
        errorContext,
        code,
        preparedCode,
        prePreparedCode,
      }
    );
    return code;
  }
}

/**
 * Normalizes the specified code to stabilize symbol names.
 *
 * @param {string} code - The source code to normalize.
 * @param {object} errorContext - The context in which the error occurred.
 * @returns {string} The normalized source code.
 */
function normalizeIdentifierNamesInCodeV2(code, errorContext = {}) {
  const preProcessedCode = prepareCodeForASTParsingV2PreProcess(code);
  // let preProcessedCode = prepareCodeForASTParsingV2PreProcess(code);

  try {
    // Parse the code into an AST using acornLoose's error tolerant parser
    const ast = acornLoose.parse(preProcessedCode, { ecmaVersion: 2020 });

    // let ast;
    // try {
    //   // Parse the code into an AST using acornLoose's error tolerant parser
    //   ast = acornLoose.parse(preProcessedCode, { ecmaVersion: 2020 });
    // } catch (err) {
    //   // Hacky workaround to attempt to catch more complex ternary cases
    //   console.error(
    //     'Try hacky workaround to attempt to catch more complex ternary cases'
    //   );
    //   preProcessedCode = `${preProcessedCode} : false`;
    //   ast = acornLoose.parse(preProcessedCode, { ecmaVersion: 2020 });
    // }

    let identifierCounter = 1;
    const identifierMap = new Map();

    const filteredAst = estraverse.replace(ast, {
      enter: (node, parent) => {
        // Attempt to fix broken ternaries
        if (node.type === 'ConditionalExpression') {
          // Fix ternaries like: foo ? [MISSING] : baz
          if (acornLoose.isDummy(node.consequent)) {
            return {
              ...node,
              consequent: {
                type: 'Literal',
                value: null,
                raw: 'null',
              },
            };
          }

          // Fix ternaries like: foo ? bar[MISSING]
          if (acornLoose.isDummy(node.alternate)) {
            return {
              ...node, // Spread the original node to copy its properties
              alternate: {
                type: 'Literal',
                value: null,
                raw: 'null',
              },
            };
          }
        }

        // Strip acornLoose's 'unknown' symbol
        if (acornLoose.isDummy(node)) {
          return estraverse.VisitorOption.Remove;
        }

        // Normalize identifiers for comparison
        if (node.type === 'Identifier') {
          if (!identifierMap.has(node.name)) {
            identifierMap.set(node.name, `symbol${identifierCounter++}`);
          }
          node.name = identifierMap.get(node.name);
        }
      },
    });

    const generatedCode = escodegen.generate(filteredAst);

    return generatedCode;
  } catch (err) {
    console.warn(
      '[diff::normalizeIdentifierNamesInCodeV2] error while trying to parse code into AST, continuing with un-normalised code',
      {
        err,
        errorContext,
        code,
        preProcessedCode,
      }
    );
    return code;
  }
}

function normalizeIdentifierNamesInCodeV3(code, errorContext = {}) {
  try {
    let identifierCounter = 1;
    const identifierMap = new Map();

    // Tokenize the code into pre-AST tokens
    const acornTokenizer = acorn.tokenizer(code, {
      ecmaVersion: "latest",
    });

    // TODO: Can we combine the Array.from and the .map to only process it once?
    const tokens = Array.from(acornTokenizer);

    const mappedTokens = tokens.map((token) => {
      // Normalize identifiers for comparison
      if (token.type.label === 'name') {
        if (!identifierMap.has(token.value)) {
          // Only normalize short 'likely to have been minimised' identifiers
          if (token.value.length <= 2) {
            identifierMap.set(token.value, `symbol${identifierCounter++}`);
          } else {
            identifierMap.set(token.value, token.value);
          }

        }
        return identifierMap.get(token.value);
      }

      // Make sure we don't lose empty strings
      if (token.type.label === 'string') {
        return token.value ?? "''";
      }

      // If token.value is undefined, fall back to the label (for things like ,;= etc
      return token.value ?? token.type.label;
    });
    const mappedTokensString = mappedTokens.join('');

    // TODO: remove this debug logging
    // console.error('[normalizeIdentifierNamesInCodeV3]', {
    //   code,
    //   mappedTokens,
    //   mappedTokensString,
    // });
    // console.log(tokens);

    //  interface Options {
    //     ecmaVersion?: 3 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020
    //     sourceType?: 'script' | 'module'
    //     onInsertedSemicolon?: (lastTokEnd: number, lastTokEndLoc?: Position) => void
    //     onTrailingComma?: (lastTokEnd: number, lastTokEndLoc?: Position) => void
    //     allowReserved?: boolean | 'never'
    //     allowReturnOutsideFunction?: boolean
    //     allowImportExportEverywhere?: boolean
    //     allowAwaitOutsideFunction?: boolean
    //     allowHashBang?: boolean
    //     locations?: boolean
    //     onToken?: ((token: Token) => any) | Token[]
    //     onComment?: ((
    //       isBlock: boolean, text: string, start: number, end: number, startLoc?: Position,
    //       endLoc?: Position
    //     ) => void) | Comment[]
    //     ranges?: boolean
    //     program?: Node
    //     sourceFile?: string
    //     directSourceFile?: string
    //     preserveParens?: boolean
    //   }

    return {
      tokens,
      mappedTokens,
      mappedTokensString,
      identifierMap,
    };
  } catch (err) {
    console.warn(
      '[diff::normalizeIdentifierNamesInCodeV3] error while trying to tokenize code into pre-AST tokens, continuing with un-normalised code',
      {
        err,
        errorContext,
        code,
      }
    );
    return code;
  }
}

/**
 * Extract unique identifiers from the specified code.
 *
 * @param {string} code - The source code from which to extract identifiers.
 * @returns {Set<string>} A set of unique identifiers extracted from the code.
 *
 * @TODO currently we're not really using this.. is it worth keeping/using somehow?
 */
function extractIdentifiersFromCode(code) {
  const ast = parseCodeToAST(code);

  const identifiers = new Set();

  traverse(ast, {
    Identifier(path) {
      identifiers.add(path.node.name);
    },
  });

  return identifiers;
}

// TODO: explore making a proper custom jsdiff comparator
//   https://github.com/kpdecker/jsdiff#defining-custom-diffing-behaviors
//
//     The simplest way to customize tokenization behavior is to simply tokenize the texts you want to diff yourself, with your own code, then pass the arrays of tokens to diffArrays. For instance, if you wanted a semantically-aware diff of some code, you could try tokenizing it using a parser specific to the programming language the code is in, then passing the arrays of tokens to diffArrays.
//     To customize the notion of token equality used, use the comparator option to diffArrays
//
//     For even more customisation of the diffing behavior, you can create a new Diff.Diff() object, overwrite its castInput, tokenize, removeEmpty, equals, and join properties with your own functions, then call its diff(oldString, newString[, options]) method. The methods you can overwrite are used as follows:
//
//     - castInput(value): used to transform the oldString and newString before any other steps in the diffing algorithm happen. For instance, diffJson uses castInput to serialize the objects being diffed to JSON. Defaults to a no-op.
//     - tokenize(value): used to convert each of oldString and newString (after they've gone through castInput) to an array of tokens. Defaults to returning value.split('') (returning an array of individual characters).
//     - removeEmpty(array): called on the arrays of tokens returned by tokenize and can be used to modify them. Defaults to stripping out falsey tokens, such as empty strings. diffArrays overrides this to simply return the array, which means that falsey values like empty strings can be handled like any other token by diffArrays.
//     - equals(left, right): called to determine if two tokens (one from the old string, one from the new string) should be considered equal. Defaults to comparing them with ===.
//     - join(tokens): gets called with an array of consecutive tokens that have either all been added, all been removed, or are all common. Needs to join them into a single value that can be used as the value property of the change object for these tokens. Defaults to simply returning tokens.join('').
function customCodeDiff(code1, code2) {
  const normalizedCode1 = normalizeIdentifierNamesInCode(code1);
  const normalizedCode2 = normalizeIdentifierNamesInCode(code2);

  // const diff = diffWords(normalizedCode1, normalizedCode2);
  const diff = diffLines(normalizedCode1, normalizedCode2);

  // diff.forEach((part) => {
  //   const color = part.added ? 'green' :
  //                 part.removed ? 'red' : 'grey';
  //   process.stderr.write(part.value[color]);
  // });
  //
  // console.log();

  console.log('customCodeDiff:', {
    diff,
    areEqual: diff.length === 1,
  });
}

// Entry point
main().catch((err) => {
  console.error('error:', err);
});
