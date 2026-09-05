// ----------------------------------------------------------------------------
// check-commits.mjs
//
// CI counterpart to commit-msg
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

import { spawnSync } from 'node:child_process';
import { loadConfig } from '../lib/fsutil.mjs';
import { validate } from '../lib/commit-rules.mjs';


function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`git ${args.join(' ')} failed: ${r.stderr.trim()}`);
    process.exit(1);
  }
  return r.stdout;
}

export function task(args) {
  const range = args[0];

  if (!range) {
    console.error('usage: node tools/run.mjs check-commits <base>..<head>');
    process.exit(1);
  }

  const config = loadConfig('.');

  // --no-merges drops merge commits from the list entirely.
  const shas = git(['log', '--no-merges', '--format=%H', range])
    .split('\n')
    .filter(Boolean);

  if (shas.length === 0) {
    console.log('no commits to check');
    return;
  }

  let ok = true;

  for (const sha of shas) {
    const message = git(['log', '-1', '--format=%B', sha]);
    const problems = validate(message, config.commitMsg);
    const short = sha.slice(0, 8);
    const header = message.split('\n')[0];

    if (problems.length === 0) {
      console.log(`  ok    ${short}  ${header}`);
    } else {
      ok = false;
      console.log(`  FAIL  ${short}  ${header}`);
      for (const p of problems) console.log(`          ${p}`);
    }
  }

  if (!ok) {
    console.error(`\n${shas.length} commit(s) checked, some rejected`);
    process.exit(1);
  }

  console.log(`\n${shas.length} commit(s) ok`);
}
