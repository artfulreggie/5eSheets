# Convenience wrapper.
#
# IMPORTANT: Do NOT put logic here; you never know how Windows will interpret
# it.
#
# Copyright (c) 2026 Artfulreggie. All Rights Reserved.

NODE_MIN := $(shell cut -d. -f1 .node-version)

.DEFAULT_GOAL := check
.PHONY: prereqs setup check install install-dry help

prereqs:
	@command -v git >/dev/null 2>&1 || { \
	  echo "git not found. Install it: https://git-scm.com/downloads"; exit 1; }
	@command -v node >/dev/null 2>&1 || { \
	  echo "node not found. Install Node $(NODE_MIN)+: https://nodejs.org"; exit 1; }
	@major=$$(node -p "process.versions.node.split('.')[0]"); \
	if [ "$$major" -lt "$(NODE_MIN)" ]; then \
	  echo "node $(NODE_MIN)+ required, found $$(node --version)"; \
	  echo "if you use nvm or fnm: run \`nvm use\` or \`fnm use\` (reads .node-version)"; \
	  exit 1; \
	fi

setup check: prereqs
	@node tools/run.mjs $@

install: prereqs
	@node tools/run.mjs install --vault="$(VAULT)"

# Separate target because "--dry-run" on the command line is make's own flag.
install-dry: prereqs
	@node tools/run.mjs install --vault="$(VAULT)" --dry-run

help:
	@echo "make setup                  enable git hooks"
	@echo "make check                  run all checks on the working tree"
	@echo "make install VAULT=/path    copy src/ into an Obsidian vault"
	@echo "make install                uses install.vaultDir"
	@echo "make install-dry            describe installation steps without installing"
