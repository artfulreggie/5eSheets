// ----------------------------------------------------------------------------
// pre-commit.mjs
//
// Validates only what is being committed. Without this a partially staged file
// can pass locally and fail in CI.
//
// `git checkout-index` writes the index to a scratch dir for checking.
//
// The scratch dir has to live inside the repo (thanks to Windows having
// questionable behavior with mktemp and its equivalents).
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { runChecks } from './check.mjs';


export function task() {
  const dir = mkdtempSync('.check-');
  let code = 0;

  try {
    const result = spawnSync(
      'git',
      ['checkout-index', '--all', `--prefix=${dir}/`],
      { stdio: 'inherit' },
    );

    if (result.status !== 0) {
      console.error('pre-commit: git checkout-index failed');
      code = 1;
    } else {
      console.log('checking staged changes');
      // Config comes from the working tree so edits to it take effect at once.
      if (runChecks(dir, { configRoot: '.' })) {
        console.log('\nall checks passed');
      } else {
        console.error('\npre-commit: check failed, commit aborted');
        code = 1;
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  process.exit(code);
}
