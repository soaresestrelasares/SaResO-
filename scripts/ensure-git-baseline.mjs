#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";

const projectRoot = process.cwd();
const baselineMessage =
  process.env.STARTER_BASELINE_COMMIT_MESSAGE ?? "chore: create project from starter";

function runGit(args, options = {}) {
  return spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });
}

function hasGit() {
  return spawnSync("git", ["--version"], { stdio: "ignore" }).status === 0;
}

function getTopLevel() {
  const result = runGit(["rev-parse", "--show-toplevel"]);

  if (result.status !== 0) {
    return undefined;
  }

  return result.stdout.trim();
}

function hasCommit() {
  return runGit(["rev-parse", "--verify", "HEAD"], { stdio: "ignore" }).status === 0;
}

function hasConfig(key) {
  return runGit(["config", "--get", key], { stdio: "ignore" }).status === 0;
}

function ensureCommitIdentity() {
  if (!hasConfig("user.name")) {
    runGit(["config", "user.name", "Verdent Agent"], { stdio: "ignore" });
  }

  if (!hasConfig("user.email")) {
    runGit(["config", "user.email", "verdent-agent@example.invalid"], {
      stdio: "ignore",
    });
  }
}

function hasStagedChanges() {
  return runGit(["diff", "--cached", "--quiet"], { stdio: "ignore" }).status !== 0;
}

function log(message) {
  console.log(`[git-baseline] ${message}`);
}

function warn(message) {
  console.warn(`[git-baseline] ${message}`);
}

function main() {
  if (!hasGit()) {
    warn("git is not available; skipping repository initialization.");
    return;
  }

  const topLevel = getTopLevel();

  if (topLevel && path.resolve(topLevel) !== path.resolve(projectRoot)) {
    log(`parent repository detected at ${topLevel}; leaving git setup unchanged.`);
    return;
  }

  if (!topLevel) {
    const init = runGit(["init"], { stdio: "inherit" });

    if (init.status !== 0) {
      warn("git init failed; continuing without a baseline commit.");
      return;
    }

    runGit(["branch", "-M", "main"], { stdio: "ignore" });
  }

  if (hasCommit()) {
    log("repository already has commits; no baseline needed.");
    return;
  }

  ensureCommitIdentity();

  const add = runGit(["add", "-A"], { stdio: "inherit" });

  if (add.status !== 0) {
    warn("git add failed; continuing without a baseline commit.");
    return;
  }

  if (!hasStagedChanges()) {
    log("no files to commit.");
    return;
  }

  const commit = runGit(["commit", "--no-gpg-sign", "-m", baselineMessage], {
    stdio: "inherit",
  });

  if (commit.status !== 0) {
    warn("baseline commit failed; check git configuration and commit manually.");
    return;
  }

  log(`created baseline commit: ${baselineMessage}`);
}

main();
