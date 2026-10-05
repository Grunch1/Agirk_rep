const fs = require('fs');
const path = require('path');

// Define the input and output file paths
const inputFilePath = path.join(__dirname, 'Vernagrer.txt');
const outputFilePath = path.join(__dirname, 'Vernagrer.html');

// Read the content of the text file
fs.readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // Split the content into lines
    const lines = data.trim().split('\n');

    // Process each line
    const formattedLines = lines.map(line => {
        // Trim whitespace from each line
        line = line.trim();

        // 1. Delete the starting "milestone-"
        let formatted = line.replace(/^milestone-/, '');

        // 2. Replace all "_" with space " "
        formatted = formatted.replace(/_/g, ' ');

        // 3. Delete the ending ".json"
        formatted = formatted.replace(/\.json$/, '');

        // 4. Insert the formatted text into the HTML code
        return `<tr>\n    <td><a href="https://example.com/book1" target="_blank">${formatted}</a></td>\n</tr>`;
    });

    // Combine all formatted lines into a single string
    const output = formattedLines.join('\n');

    // Write the output to a new file
    fs.writeFile(outputFilePath, output, err => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }

        console.log('File has been processed and saved as Vernagrer.html');
    });
});
