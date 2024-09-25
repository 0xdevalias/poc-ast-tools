#!/usr/bin/env node

// TODO: Refactor this to have a CLI, parse args, etc (maybe also allow HTML to be piped into it to be parsed directly)

import fetch from 'node-fetch';
import cheerio from 'cheerio';

let DEBUG = false;

async function fetchHTML(url) {
  const response = await fetch(url);
  const html = await response.text();
  return html;
}

function extractScriptURLs($) {
  // Extracts all script URLs that include '_next' in their src attribute
  return $('html script[src*="_next"]')
    .map((_, el) => $(el).attr('src'))
    .get()
    .sort();
}

function extractAndParseNextScriptData($) {
  const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/;

  const { nextData, warnings } = $('script:not([src])')
    .map((i, elem) => $(elem).html())
    .get()
    .filter(scriptText => scriptText.includes('self.__next_f.push'))
    .reduce((acc, content) => {
      const match = regex.exec(content);
      if (!match) {
        acc.warnings.push(`Warning: Unable to parse this content: ${content}`);
      } else {
        acc.nextData.push(match[1].replace(/\\"/g, '"'));
      }
      return acc;
    }, { nextData: [], warnings: [] });

  return { nextData, warnings };
}

function parseJSONFromEntry(entry) {
  const jsonPart = entry.substring(entry.indexOf('[') + 1, entry.lastIndexOf(']'));
  try {
    return JSON.parse(`[${jsonPart}]`);
  } catch (e) {
    console.error("Failed to parse JSON for entry: ", entry);
    return [];
  }
}

function convertKeyValuePairsToArray(keyValueArray) {
  const keyValuePairs = [];
  for (let i = 0; i < keyValueArray.length; i += 2) {
    keyValuePairs.push([keyValueArray[i], keyValueArray[i + 1]]);
  }
  return Object.fromEntries(keyValuePairs);
}

function processModuleDependencies(nextData) {
  return nextData
    .filter(f => f?.includes('static/'))
    .flatMap(f => f.split('\n'))
    .map(parseJSONFromEntry)
    .filter(f => Array.isArray(f) && f.length > 0)
    .map(f => {
      if (!Array.isArray(f?.[1])) {
        return f;
      } else {
        f[1] = convertKeyValuePairsToArray(f[1]);
        return f;
      }
    })
    .filter(f => Array.isArray(f) && f.length === 3 && typeof f?.[1] === 'object')
    .reduce((acc, [moduleId, dependencies, _]) => {
      acc[moduleId] = dependencies;
      return acc;
    }, {});
}

// Function to transform dependencies into a simpler, directly accessible format
function transformDependencies(dependencies) {
  return Object.values(dependencies).reduce((acc, currentDeps) => {
    Object.entries(currentDeps).forEach(([moduleId, path]) => {
      // If the paths match, skip to the next entry
      if (acc?.[moduleId] === path) return

      if (!acc[moduleId]) {
        // If this module ID has not been encountered yet, initialize it with the current path
        acc[moduleId] = path;
      } else if (typeof acc[moduleId] === 'string' && acc[moduleId] !== path) {
        // If the current path for this module ID is different from the existing one,
        // and the existing one is a string, transform it into an array containing both paths.
        const oldPath = acc[moduleId];
        acc[moduleId] = [oldPath, path];
      } else if (Array.isArray(acc[moduleId]) && !acc[moduleId].includes(path)) {
        // If the existing entry for this module ID is an array and does not already include the current path,
        // add the current path to the array.
        acc[moduleId].push(path);
      } else {
        // Log any unhandled cases for further investigation. This could be used to catch any unexpected data structures or duplicates.
        console.error('Unhandled case', { acc, currentDeps, moduleId, path });
      }
    });
    return acc;
  }, {});
}

async function extractChunkUrls(baseUrl) {
  const html = await fetchHTML(baseUrl);
  const $ = cheerio.load(html);

  const scriptUrls = extractScriptURLs($).map(path => `${baseUrl}${path}`);
  const { nextData, warnings } = extractAndParseNextScriptData($);

  const moduleDependencies = processModuleDependencies(nextData);

  const chunkMappings = transformDependencies(moduleDependencies)

  const uniqueChunkPaths = Array.from(new Set(Object.values(chunkMappings))).sort()

  const dynamicChunkUrls = uniqueChunkPaths
    .map(path => `https://www.udio.com/_next/${path}`)
    .sort()

  const chunkUrls = Array.from(new Set([...scriptUrls, ...dynamicChunkUrls])).sort()

  const buildId = nextData
    .filter(f => f?.includes('buildId'))
    .flatMap(f => f.trim().split('\n'))
    .flatMap(parseJSONFromEntry)
    .map(f => Array.isArray(f) ? f.flat() : f)
    .map(f => f?.[3]?.buildId)
    .filter(Boolean)?.[0]

  // TODO: probably should return some more of these bits as well
  DEBUG &&
    console.log({
      scriptUrls,
      moduleDependencies,
      chunkMappings,
      uniqueChunkPaths,
      dynamicChunkUrls,
      chunkUrls,
      buildId,
    })

  return { buildId, chunkUrls };
}

extractChunkUrls('https://www.udio.com').then(({ buildId, chunkUrls }) => {
  console.log(chunkUrls.join('\n'));
  console.log(buildId);
}).catch(console.error);
