// ----------------------------------------------------------------------------
// setup.mjs
//
// Spool up git hooks.
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

import { spawnSync } from 'node:child_process';

export function task() {
  const r = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
    stdio: 'inherit',
  });

  if (r.status !== 0) {
    console.error('setup: could not set core.hooksPath (we in a git repo?)');
    process.exit(1);
  }

  console.log('hooks enabled: core.hooksPath = .githooks');
  console.log('run `node tools/run.mjs check` to validate the tree');
}
