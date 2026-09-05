// ----------------------------------------------------------------------------
// check.mjs
//
// Runs every check against a dir and reports back.
//
// NOTE: `dir` is "." for CI
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

import { loadConfig } from '../lib/fsutil.mjs';
import * as jsSyntax from '../checks/js-syntax.mjs';
import * as frontmatter from '../checks/frontmatter.mjs';
import * as scriptRefs from '../checks/script-refs.mjs';
import * as trackedConfig from '../checks/tracked-config.mjs';


const CHECKS = [jsSyntax, frontmatter, scriptRefs, trackedConfig];

export function runChecks(root = '.', { configRoot = '.' } = {}) {
  const config = loadConfig(configRoot);
  let ok = true;

  for (const check of CHECKS) {
    // A check that throws (a missing directory, an unreadable file) is a
    // failed check
    let problems;
    try {
      problems = check.run(root, config);
    } catch (err) {
      problems = [err.message];
    }

    if (problems.length === 0) {
      console.log(`  ok    ${check.name}`);
    } else {
      ok = false;
      console.log(`  FAIL  ${check.name}`);
      for (const p of problems) {
        console.log(`          ${p}`);
      }
    }
  }

  return ok;
}

export function task() {
  console.log('checking working tree');

  if (!runChecks('.')) {
    console.error('\ncheck failed');
    process.exit(1);
  }
  console.log('\nall checks passed');
}
