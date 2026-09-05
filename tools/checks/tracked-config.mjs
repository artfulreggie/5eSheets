// ----------------------------------------------------------------------------
// tracked-config.mjs
//
// Keeps a personal vault path out of the tracked config.
//
// NOTE: this is the one check that inspects the config rather than using
// it. It reads config.json straight from the tree under test, unmerged, so
// under pre-commit it sees exactly what is staged rather than what happens
// to be in the working copy.
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';


export const name = 'tracked config';

export function run(root) {
  const file = join(root, 'config.json');

  if (!existsSync(file)) {
    return [`no config.json in ${root}`];
  }

  const tracked = JSON.parse(readFileSync(file, 'utf8'));
  const vaultDir = tracked.install?.vaultDir;

  if (typeof vaultDir === 'string' && vaultDir.trim()) {
    return [
      `config.json sets install.vaultDir to "${vaultDir}"`
      + '\n          that path is yours alone: move it to config.local.json,'
      + ' which git ignores',
    ];
  }

  return [];
}
