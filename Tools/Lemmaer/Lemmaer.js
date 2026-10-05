const fs = require('fs');
const path = require('path');

// Function to extract lemma text and title from a file
function extractLemmas(file) {
    try {
        // Resolve the absolute path of the file
        const filePath = path.join(__dirname, file);
        
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Extract the 'nodes' array from the file using a regular expression
        const nodesMatch = fileContent.match(/const nodes = (\[.*?\]);/s); // Lazy match the array content
        if (!nodesMatch || nodesMatch.length < 2) {
            console.error(`Error: Could not find 'nodes' array in file ${file}`);
            return;
        }

        // Parse the nodes array as JSON
        const nodes = JSON.parse(nodesMatch[1]);

        // Extract the title from the file using a regular expression
        const titleMatch = fileContent.match(/const title = "(.*?)";/);
        const title = titleMatch ? titleMatch[1] : 'Untitled';

        // Filter nodes where 'is_lemma' is true and collect the text values
        const lemmas = nodes
            .filter(node => node.is_lemma)
            .map(node => node.text);

        // Define the output file path with the title included in the name
        const baseFileName = path.basename(file, '.js');
        const outputFileName = `Lemma_${baseFileName.split('-')[1]}_${title}.txt`;
        const outputFile = path.join(__dirname, outputFileName);

        // Write all lemma values to the file in a single line
        fs.writeFileSync(outputFile, lemmas.join(' ')); // Join lemmas with a space
        console.log(`Lemma values written to: ${outputFile}`);
    } catch (error) {
        console.error(`Error processing file ${file}:`, error);
    }
}

// Process all files in the current directory that start with 'section' and end with '.js'
fs.readdir(__dirname, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    // Filter for files that start with 'section' and end with '.js'
    const sectionFiles = files.filter(file => file.startsWith('section') && file.endsWith('.js'));

    // Extract lemmas from each file
    sectionFiles.forEach(file => extractLemmas(file));
});
