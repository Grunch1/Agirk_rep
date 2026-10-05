const fs = require("fs");
const path = require("path");

const DEFAULT_REPO_ROOT = path.resolve(__dirname, "..");
const titleCollator = new Intl.Collator("hy", { numeric: true });

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function newlineOf(content) {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

function loadSections(convertedDirectory) {
  const files = fs.readdirSync(convertedDirectory)
    .filter((file) => /^section-.*\.json$/.test(file));
  if (!files.length) throw new Error(`No section JSON files found in ${convertedDirectory}`);

  const sections = [];
  const errors = [];
  for (const file of files) {
    try {
      if (!/^section-\d+\.json$/.test(file)) throw new Error("Invalid section filename");
      const jsonData = JSON.parse(fs.readFileSync(path.join(convertedDirectory, file), "utf8").replace(/^\uFEFF/, ""));
      if (!jsonData || typeof jsonData !== "object" || Array.isArray(jsonData)) {
        throw new Error("Section JSON must contain an object");
      }
      if (typeof jsonData.title !== "string" || !jsonData.title.trim()) {
        throw new Error("Section title must be a nonempty string");
      }
      const id = path.basename(file, ".json");
      if (Object.hasOwn(jsonData, "sectionId") && jsonData.sectionId !== id) {
        throw new Error(`sectionId must match ${id}`);
      }
      sections.push({ file, id, title: jsonData.title });
    } catch (error) {
      errors.push(`${file}: ${error.message}`);
    }
  }
  if (errors.length) throw new Error(`Invalid section data; no files were changed:\n${errors.join("\n")}`);

  return sections.sort((first, second) => titleCollator.compare(first.title, second.title)
    || (first.file < second.file ? -1 : first.file > second.file ? 1 : 0));
}

// Match the complete element, including any nested elements of the same tag.
function findElement(content, tag, id, label) {
  const openingTags = new RegExp(`<${tag}\\b[^>]*>`, "gi");
  const matches = [];
  for (const match of content.matchAll(openingTags)) {
    if (!id || new RegExp(`\\bid\\s*=\\s*(["'])${id}\\1`, "i").test(match[0])) matches.push(match);
  }
  if (matches.length !== 1) throw new Error(`${label}: expected exactly one ${id ? `#${id}` : tag} element`);

  const opening = matches[0];
  const tags = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
  tags.lastIndex = opening.index + opening[0].length;
  let depth = 1;
  let token;
  while ((token = tags.exec(content))) {
    depth += /^<\//.test(token[0]) ? -1 : 1;
    if (depth === 0) return { start: opening.index, innerStart: opening.index + opening[0].length, innerEnd: token.index, end: tags.lastIndex };
  }
  throw new Error(`${label}: missing closing ${tag} tag`);
}

function renderYearBoxes(sections, newline, indentation = "") {
  return sections.map(({ id, title }) => `${indentation}<div class="year-box" id="${id}">${escapeHtml(title)}</div>`).join(newline);
}

function replaceInitialSections(content, sections, label) {
  const starts = [...content.matchAll(/^[ \t]*\/\/ BEGIN GENERATED_INITIAL_SECTIONS[ \t]*\r?$/gm)];
  const ends = [...content.matchAll(/^[ \t]*\/\/ END GENERATED_INITIAL_SECTIONS[ \t]*\r?$/gm)];
  if (starts.length !== 1 || ends.length !== 1 || starts[0].index >= ends[0].index) {
    throw new Error(`${label}: expected exactly one ordered GENERATED_INITIAL_SECTIONS marker pair`);
  }
  const innerStart = starts[0].index + starts[0][0].length + 1;
  const innerEnd = ends[0].index;
  const newline = newlineOf(content);
  const initialSections = sections.slice(0, 7).map(({ id, title }) => ({ id, title }));
  const json = JSON.stringify(initialSections, null, 2)
    .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029").replace(/\n/g, newline);
  return content.slice(0, innerStart) + `const INITIAL_SECTIONS = ${json};${newline}` + content.slice(innerEnd);
}

function replaceEditionRows(content, sections, label) {
  const edition = findElement(content, "section", "Edition", label);
  const editionContent = content.slice(edition.innerStart, edition.innerEnd);
  const table = findElement(editionContent, "table", null, `${label} #Edition`);
  const innerStart = edition.innerStart + table.innerStart;
  const innerEnd = edition.innerStart + table.innerEnd;
  const tableStart = edition.innerStart + table.start;
  const indentation = content.slice(content.lastIndexOf("\n", tableStart) + 1, tableStart);
  const newline = newlineOf(content);
  const rows = sections.map(({ id, title }, index) => [
    `${indentation}    <tr>`,
    `${indentation}      <td>`,
    `${indentation}        <a href="reading.html?section=${id}" target="_blank" rel="noopener">${index + 1}. ${escapeHtml(title)}</a>`,
    `${indentation}      </td>`,
    `${indentation}    </tr>`,
  ].join(newline)).join(newline);
  const inner = `${newline}${indentation}  <tbody>${newline}${rows}${newline}${indentation}  </tbody>${newline}${indentation}`;
  return content.slice(0, innerStart) + inner + content.slice(innerEnd);
}

function readExisting(file, required = false) {
  if (required || fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  // A missing generated file is fine, but its destination directory must exist.
  if (!fs.statSync(path.dirname(file)).isDirectory()) throw new Error(`Output directory missing: ${path.dirname(file)}`);
  return "";
}

function buildOutputPlan({ repoRoot = DEFAULT_REPO_ROOT } = {}) {
  const lemmaDirectory = path.join(repoRoot, "test.aghvesagirk.com", "Lemma");
  const sections = loadSections(path.join(lemmaDirectory, "converted"));
  const manifestFile = path.join(lemmaDirectory, "section-index.json");
  const readingFile = path.join(lemmaDirectory, "reading.js");
  const homeFile = path.join(lemmaDirectory, "Home.html");
  const legacyFiles = [
    path.join(lemmaDirectory, "index-panel.html"),
  ];

  // Prepare every output before writing anything, including script markers and HTML anchors.
  const manifestContent = readExisting(manifestFile);
  const readingContent = readExisting(readingFile, true);
  const homeContent = readExisting(homeFile, true);
  const legacyContents = legacyFiles.map((file) => readExisting(file));
  const manifest = Object.fromEntries(sections.map(({ file, title }) => [file, title]));
  const manifestNewline = newlineOf(manifestContent);
  const files = [
    { file: manifestFile, content: JSON.stringify(manifest, null, 2).replace(/\n/g, manifestNewline) + manifestNewline },
    { file: readingFile, content: replaceInitialSections(readingContent, sections, readingFile) },
    { file: homeFile, content: replaceEditionRows(homeContent, sections, homeFile) },
    ...legacyFiles.map((file, index) => ({ file, content: renderYearBoxes(sections, newlineOf(legacyContents[index])) + newlineOf(legacyContents[index]) })),
  ];
  return { sections, files };
}

function generateSectionIndex(options) {
  const plan = buildOutputPlan(options);
  for (const { file, content } of plan.files) fs.writeFileSync(file, content, "utf8");
  return plan;
}

function main() {
  try {
    const { sections, files } = generateSectionIndex();
    console.log(`Generated ${sections.length} titles in alphabetical order and updated ${files.length} files.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { escapeHtml, loadSections, buildOutputPlan, generateSectionIndex, main };
if (require.main === module) main();
