// Keep the old command working with the shared section-index generator.
const { main } = require("../generate-section-index.js");

if (require.main === module) main();
module.exports = { main };
