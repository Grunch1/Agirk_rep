(function (global) {
  "use strict";

  // The JSON file stores filename/title pairs in Armenian alphabetical order.
  function getEntries(index) {
    if (!index || typeof index !== "object" || Array.isArray(index)) {
      throw new Error("Invalid section index: expected filename/title pairs.");
    }

    const entries = Object.entries(index).map(([fileName, title]) => {
      if (!/^section-\d+\.json$/.test(fileName) || typeof title !== "string" || !title.trim()) {
        throw new Error("Invalid section index entry.");
      }
      return { id: fileName.slice(0, -5), fileName, title };
    });

    if (!entries.length) throw new Error("Section index contains no entries.");
    return entries;
  }

  async function load() {
    const response = await fetch("section-index.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load section index: ${response.status}`);
    return getEntries(await response.json());
  }

  global.SectionIndex = { getEntries, load };
})(window);
