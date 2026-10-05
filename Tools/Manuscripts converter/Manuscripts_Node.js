const fs = require('fs');

// File paths
const jsonFilePath = './output.json'; // Replace with the path to your JSON file
const htmlFilePath = './manuscripts.html'; // Output HTML file

// Function to generate HTML from JSON data
function generateHTMLFromJSON(data) {
    let htmlContent = '';

    for (const [header, clusters] of Object.entries(data)) {
        htmlContent += `<h1 class="Manuscript_Location">${header}</h1> <br>\n`;
        htmlContent += `<div class="Location_box">\n`;

        clusters.forEach(cluster => {
            htmlContent += `
  <div class="Manuscript_Location_Box">
    <div class="Manuscript_Box">
      <h3>Title : Collection</h3>
      <h4>Manuscript id: ${cluster['MS'] || 'Unknown'}</h4>
      <h4>Place : ${cluster['Place'] || 'Unknown'}</h4>
      <h4>Century : ${cluster['Century'] || 'Unknown'}</h4>
      <h4>Scribe : ${cluster['Scribe'] || 'Unknown'}</h4>
      <button type="Manuscript_Read_">Read</button>
      <a href="">
        <button type="Manuscript_Download">Download</button>
      </a>
    </div>
  </div>`;
        });

        htmlContent += `</div>\n`; // Close Location_box
    }

    return htmlContent;
}

// Main function
function createHTMLFromJSON() {
    try {
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
        const htmlContent = generateHTMLFromJSON(jsonData);

        // Wrap the HTML content in a basic structure
        const completeHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manuscript Data</title>
    <style>
        /* Add any CSS styling here */
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

        fs.writeFileSync(htmlFilePath, completeHTML);
        console.log(`HTML file created successfully at ${htmlFilePath}`);
    } catch (error) {
        console.error('Error processing JSON file:', error);
    }
}

createHTMLFromJSON();
