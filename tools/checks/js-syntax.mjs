// ----------------------------------------------------------------------------
// js-syntax.mjs
//
// Check the syntax for every js file.
//
// NOTE: Meta Bind / JS Engine snippets are just function BODIES and not whole
// programs using `return` or `await` without context which `node --check`
// rejects.
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { walk } from '../lib/fsutil.mjs';

export const name = 'js syntax';

/**
 * compileFunction puts the position in `err.stack`, never in `err.message`.
 * The first stack line reads "<filename>:<line>", and the filename here can
 * hold colons and spaces, so read the number off the end rather than
 * pattern-matching the name.
 *
 * `offset` undoes the lines the wrapper added above the source.
 */
function lineOf(err, offset) {
  const head = String(err.stack ?? '').split('\n', 1)[0];
  const line = Number(head.slice(head.lastIndexOf(':') + 1));
  return Number.isInteger(line) ? line - offset : null;
}

export function run(root, config) {
  const cfg = config.checks.jsSyntax;
  const dir = join(root, cfg.dir);
  const problems = [];

  for (const rel of walk(dir, { skip: config.skipFiles, extensions: cfg.extensions })) {
    const source = readFileSync(join(dir, rel), 'utf8');
    // The wrapper below opens on its own line, putting source line 1 on
    // line 2.
    const offset = cfg.wrapAsFunctionBody ? 1 : 0;

    try {
      if (cfg.wrapAsFunctionBody) {
        vm.compileFunction(`return (async () => {\n${source}\n})();`, [], {
          filename: rel,
        });
      } else {
        new vm.Script(source, { filename: rel });
      }
    } catch (err) {
      const line = lineOf(err, offset);
      const at = line === null ? '' : `:${line}`;
      problems.push(`${cfg.dir}/${rel}${at}: ${err.message}`);
    }
  }

  return problems;
}
