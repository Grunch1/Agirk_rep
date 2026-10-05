"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const CLEANED_BASE = "ecbe01365430126ce188c76ce17cb3108d5804d4";
const ZERO = "0".repeat(40);
const ADMIN_FILES = new Set([
  "update_tags.php", "get_section_json.php", "style.css", "index.html", "admin_logo.png", "admin.jpg",
].map((file) => `admin.aghvesagirk.com/${file}`));
const EXAMPLE = "source code/sample_data.txt";
const TITLES = "test.aghvesagirk.com/lemma/section-index.json";
const ANNOTATIONS = "php/tags.json";
const TOOL_NOTES = new Set([
  "tools/converter xml2js/delete code on all xml files.txt",
  "tools/lemmaer/put the js files here and run lemmaer.txt",
  "tools/manuscripts converter/read me.txt",
]);
const PRIVATE_DIRECTORIES = new Set([
  "node_modules", "vendor", ".cache", ".vite", "build", "dist", "dist-ssr", "logs",
  "session", "temp", "tmp", "__pycache__", ".idea", ".vscode",
]);
const DATA_EXTENSIONS = /\.(?:xml|jsonl|ndjson|ya?ml|csv|tsv|sql|db|sqlite3?|xls|xlsx|ods|png|jpe?g|gif|webp|svg|ico|bmp|tiff?|pdf|docx?|woff2?|ttf|eot|mo|zip|7z|rar|tar|gz|bz2|xz|crt|key|pem|pfx|a|o|pyc|so)$/i;

function pathViolation(filename) {
  const file = filename.replace(/\\/g, "/").toLowerCase();
  const parts = file.split("/");
  const basename = parts.at(-1);
  if (file.startsWith("/") || parts.some((part) => !part || part === "." || part === ".." || part === ".git")) return "Git internals or invalid path";
  if (basename === ".gitkeep") return null;
  if (file.startsWith("admin.aghvesagirk.com/")) return ADMIN_FILES.has(file) ? null : "private admin file";
  if (file === EXAMPLE) return null;
  if (parts.some((part) => PRIVATE_DIRECTORIES.has(part) || /^converted(?:\s*\(.*\))?$/.test(part))) return "private data, dependencies, or generated output";
  if (file.startsWith("tools/legacyxmldata/") || file.startsWith("tools/all_sections_legacy_code 9.15.24/") || file.startsWith("test.aghvesagirk.com/nkarner/") || file.startsWith("test.aghvesagirk.com/lemma/mzip/")) return "excluded collection";
  if (file === "myadmin/config.inc.php" || (/\.env(?:\..*)?$/.test(basename) && basename !== ".env.example")) return "local credentials";
  if (DATA_EXTENSIONS.test(basename) || /^section-\d+\.js$/.test(basename)) return "content dataset, media, or binary file";
  if (basename.endsWith(".json")) {
    if (file === TITLES || file === ANNOTATIONS || ["package.json", "package-lock.json", "npm-shrinkwrap.json", "composer.json"].includes(basename) || ["myadmin/babel.config.json", "myadmin/.rtlcssrc.json"].includes(file) || /^myadmin\/themes\/[^/]+\/theme\.json$/.test(file)) return null;
    return "JSON outside the metadata and annotation allowlist";
  }
  if (file.startsWith("tools/") && basename.endsWith(".txt") && !TOOL_NOTES.has(file)) return "tool data export";
  if (/^tools\/(converter xml2js|lemmaer)\/section-[^/]+\.js$/.test(file) || file === "tools/converter xml2js/txt.dart") return "JavaScript or Dart data export";
  if (["tools/editions page converter/editions.html", "tools/generatedivs/index-panel.html", "tools/manuscripts converter/manuscripts.html", "tools/references to html/references.html", "tools/titles - vernagrer/reference to html/references.html"].includes(file) || (file.startsWith("tools/titles - vernagrer/") && basename === "vernagrer.html")) return "generated HTML data export";
  if (["analysis_output.txt", "tree.txt", "tree_output.txt", "error_log", "desktop.ini", "thumbs.db", ".ds_store", ".classpath", ".project", ".appledouble", ".lsoverride"].includes(basename) || /^error_log\./.test(basename) || /\.(?:bak|cache|log|orig|session|swo|swp|tmp|code-workspace|iml|ipr|iws)$/.test(basename) || /~(?:\..*)?$/.test(basename)) return "local output or backup";
  return null;
}

function runGit(args, options = {}) {
  const result = spawnSync("git", args, { cwd: options.cwd, input: options.input, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0 || result.stderr.length) throw new Error(`Could not verify Git data (${args[0]}). Push/commit stopped; repair Git errors before retrying.`);
  return result.stdout;
}

function stagedEntries(cwd) {
  return runGit(["ls-files", "--stage", "-z"], { cwd }).toString("utf8").split("\0").filter(Boolean).map((row) => {
    const match = /^(\d+) ([a-f0-9]{40}) (\d)\t([\s\S]+)$/.exec(row);
    if (!match || match[3] !== "0") throw new Error("Unresolved or unreadable staging entries.");
    return { mode: match[1], oid: match[2], file: match[4] };
  });
}

function treeEntries(commit, cwd) {
  return runGit(["ls-tree", "-r", "-z", commit], { cwd }).toString("utf8").split("\0").filter(Boolean).map((row) => {
    const match = /^(\d+) (\w+) ([a-f0-9]{40})\t([\s\S]+)$/.exec(row);
    if (!match || match[2] !== "blob") throw new Error("Submodule or unreadable tree entry.");
    return { mode: match[1], oid: match[3], file: match[4] };
  });
}

function readBlockedObjects() {
  const lines = fs.readFileSync(path.resolve(__dirname, "../.githooks/blocked-objects"), "utf8").trim().split(/\r?\n/);
  if (!lines.length || lines.some((line) => !/^[a-f0-9]{40}$/.test(line))) throw new Error("The removed-object guard is missing or invalid.");
  return new Set(lines);
}

function verifyEntries(entries, cwd, blocked, inspected = new Set()) {
  const violations = [];
  for (const entry of entries) {
    const reason = pathViolation(entry.file);
    if (reason) violations.push(`${entry.file}: ${reason}`);
    if (!["100644", "100755"].includes(entry.mode)) violations.push(`${entry.file}: links and submodules cannot be verified`);
    if (blocked.has(entry.oid)) violations.push(`${entry.file}: contents match a removed private/data file`);
  }
  if (violations.length) throw new Error(`Excluded content detected:\n${violations.slice(0, 12).map((line) => `  ${line}`).join("\n")}`);

  const pending = entries.filter((entry) => !inspected.has(`${entry.oid}:${entry.file.toLowerCase()}`));
  if (!pending.length) return;
  const sizes = runGit(["cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"], {
    cwd, input: Buffer.from(pending.map((entry) => entry.oid).join("\n") + "\n"),
  }).toString("utf8").trim().split(/\r?\n/);
  if (sizes.length !== pending.length) throw new Error("Incomplete Git object inspection.");
  for (let index = 0; index < pending.length; index++) {
    const entry = pending[index];
    const fields = sizes[index].split(" ");
    const size = Number(fields[2]);
    if (fields.length !== 3 || fields[0] !== entry.oid || fields[1] !== "blob" || !Number.isSafeInteger(size) || size < 0) throw new Error("Missing or unreadable Git object.");
    const file = entry.file.toLowerCase();
    if ((file === ".gitkeep" || file.endsWith("/.gitkeep")) && size !== 0) throw new Error(`${entry.file}: folder placeholders must be empty.`);
    if (file === EXAMPLE) {
      if (size > 16384) throw new Error("The XML example exceeds 16 KB; the complete corpus must stay private.");
      const example = runGit(["cat-file", "blob", entry.oid], { cwd }).toString("utf8");
      if ((example.match(/<graph(?:\s|>)/g) || []).length !== 1) throw new Error("The data example must contain one small graph.");
    }
    if (file === TITLES) {
      if (size > 1024 * 1024) throw new Error("The title index is unexpectedly large.");
      const titles = JSON.parse(runGit(["cat-file", "blob", entry.oid], { cwd }).toString("utf8").replace(/^\uFEFF/, ""));
      if (!titles || typeof titles !== "object" || Array.isArray(titles) || Object.entries(titles).some(([name, title]) => !/^section-\d+\.json$/.test(name) || typeof title !== "string" || !title.trim() || title.length > 512)) throw new Error("The title index must contain filenames and titles only.");
    }
    inspected.add(`${entry.oid}:${file}`);
  }
}

function pushUpdates(input) {
  return input.trim() ? input.trim().split(/\r?\n/).map((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts.length !== 4 || !/^[a-f0-9]{40}$/.test(parts[1]) || !/^[a-f0-9]{40}$/.test(parts[3])) throw new Error("Unreadable push update; push stopped.");
    return { localRef: parts[0], localOid: parts[1], remoteRef: parts[2], remoteOid: parts[3] };
  }) : [];
}

function verifyPush(input, cwd, blocked) {
  const updates = pushUpdates(input);
  const inspected = new Set();
  const checkedCommits = new Set();
  for (const update of updates) {
    if (update.localOid === ZERO) continue;
    if (update.localRef.startsWith("refs/") && !/^refs\/(heads|tags)\//.test(update.localRef)) throw new Error(`Private local Git ref cannot be pushed: ${update.localRef}`);
    if (!/^refs\/(heads|tags)\//.test(update.remoteRef)) throw new Error(`Private Git ref cannot be pushed: ${update.remoteRef}`);
    const commit = runGit(["rev-parse", "--verify", `${update.localOid}^{commit}`], { cwd }).toString("utf8").trim();
    const ancestry = spawnSync("git", ["merge-base", "--is-ancestor", CLEANED_BASE, commit], { cwd, windowsHide: true });
    if (ancestry.error || ancestry.stderr.length || ![0, 1].includes(ancestry.status)) throw new Error("Could not read commit history; push stopped.");
    if (ancestry.status === 1) throw new Error("This branch or tag uses history from before the cleanup. Start it from cleaned main before pushing.");
    const commits = runGit(["rev-list", commit, `^${CLEANED_BASE}`], { cwd }).toString("utf8").trim().split(/\r?\n/).filter(Boolean);
    // The tip also gets checked when pushing the already published baseline.
    for (const oid of new Set([commit, ...commits])) {
      if (checkedCommits.has(oid)) continue;
      verifyEntries(treeEntries(oid, cwd), cwd, blocked, inspected);
      checkedCommits.add(oid);
    }
  }
  return checkedCommits.size;
}

function main() {
  try {
    const mode = process.argv[2];
    const cwd = runGit(["rev-parse", "--show-toplevel"]).toString("utf8").trim();
    const blocked = readBlockedObjects();
    if (mode === "--staged") {
      verifyEntries(stagedEntries(cwd), cwd, blocked);
    } else if (mode === "--push") {
      verifyPush(fs.readFileSync(0, "utf8"), cwd, blocked);
    } else {
      throw new Error("Use --staged or --push.");
    }
  } catch (error) {
    process.stderr.write(`Public repository guard: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { CLEANED_BASE, pathViolation, verifyEntries, verifyPush, pushUpdates };
if (require.main === module) main();
