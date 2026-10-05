const path = require('path');
const { processAllSectionFiles } = require('./Node-beta');

// Find & Convert all XML files starting with 'section'
// Use the same reading nodes and statistics as Node-beta.js, in JSON format.
// Prefer normal_form for text; use the original XML text only as a backup.
processAllSectionFiles({
    format: 'json',
    outputDirectory: path.join(__dirname, 'converted'),
    errorLogPath: path.join(__dirname, 'Node-gamma-errors.log'),
});
