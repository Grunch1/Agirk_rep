const fs = require('fs');

// Read the Editions.txt file
fs.readFile('Editions.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Split the file content into lines and trim each line
  const lines = data.split('\n').map(line => line.trim()).filter(line => line);

  // Start the HTML output
  let htmlOutput = '<table>\n';

  // Generate HTML rows for each line
  lines.forEach(line => {
    htmlOutput += `  <tr>
    <td>
      <a href="https://test.aghvesagirk.com/Lemma/reading.html" target="_blank">${line}</a>
    </td>
  </tr>\n`;
  });

  // Close the table
  htmlOutput += '</table>';

  // Write the HTML output to a file
  fs.writeFile('Editions.html', htmlOutput, 'utf8', err => {
    if (err) {
      console.error('Error writing the file:', err);
    } else {
      console.log('HTML file has been created as "Editions.html".');
    }
  });
});
