const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Find & Convert all XML files starting with 'section'
function processAllSectionFiles() {
    const directoryPath = path.join(__dirname, '..', 'LegacyXMLData');
    cunt = 1;

    // Read all files in the current directory
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }
        // Filter for files starting with 'section' and ending with '.xml'
        const xmlFiles = files.filter(file => file.startsWith('section') && file.endsWith('.xml'));
        console.log(xmlFiles);
        
        // Process each filtered XML file
        xmlFiles.forEach(xmlFileName => {
            parseXMLAndGenerateJS(xmlFileName);
            cunt++;
        });
    });
}

// Function that Converts gathered XML --> JS objects
function parseXMLAndGenerateJS(xmlFileName) {
     // Use the xmlFileName dynamically for each file
     const xmlFilePath = path.join(__dirname, '..', 'LegacyXMLData', xmlFileName);  // Full path for the XML file
     const jsFileName = xmlFileName.replace('.xml', '.js');  // Create corresponding JS file name
     const jsFilePath = path.join(__dirname, jsFileName);    // Full path for the JS file

    // Read the section.xml file
    fs.readFile(xmlFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading XML file:', err);
            return;
        }

        // Parse the XML data
        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error('Error parsing XML file:', err);
                return;
            }

            // Initializing  ...
            const keys = result['graphml']['key']; // Get the list of keys
            const nodes = result['graphml']['graph'][0]['node']; // Get the list of nodes
            const edges = result['graphml']['graph'][0]['edge']; // Get the list of edges
            const nodeObjects = []; // Creates A Single Node
            const nodeMap = {}; // my nodes for quick look-up
            const keyMap = {};  // my keys  for quick look-up
            let isLemmaCount = 0;  // Initialize count for [is_lemma true] values
            let nullOrEmptyTextCount = 0;  // Initialize count for null, N/A, or empty text values
            let title = "Unknown";  // Initialize the constant for the 'name' key
            let globalExtrasList = new Set(); // List to hold all extracted "extra" values
            targets: []  // Array to hold target node IDs, from edges.

            // Create a dynamic mapping of attribute names to their respective key IDs
            keys.forEach(key => {
                const attrName = key.$['attr.name'];
                const id = key.$.id;
                keyMap[attrName] = id; // Map the attribute name to its id (e.g., 'text' => 'dn2')
            });
            
            // Iterate through each node and extract required data dynamically
            nodes.forEach(node => {
                const nodeId = node.$.id || 'N/A'; // Use 'N/A' if id is missing or invalid
                let textValue = null;
                let rankValue = null;
                let isStartValue = false;
                let isLemmaValue = false; // Default isLemma value

                // Iterate through the data tags and extract values based on dynamic keys
                node.data.forEach(dataItem => {
                    if (dataItem.$.key === keyMap['text']) {
                        textValue = dataItem._ || 'N/A'; // Use 'N/A' if text is missing
                    }
                    if (dataItem.$.key === keyMap['rank']) {
                        rankValue = parseInt(dataItem._) || 0; // Default to 0 if rank is missing or invalid
                    }
                    if (dataItem.$.key === keyMap['is_start']) {
                        isStartValue = dataItem._ === 'true'; // Set is_start value to true if it exists
                    }
                    if (dataItem.$.key === keyMap['is_lemma']) {
                        isLemmaValue = dataItem._ === 'true'; // Extract is_lemma as a boolean
                        if (isLemmaValue) isLemmaCount++; // Increment the isLemmaCount if true
                    }
                    // Extract 'name' from dn1 aka Title
                    if (dataItem.$.key === keyMap['name']) {
                        title = (dataItem._ || 'Unknown').startsWith("milestone-") 
                            ? dataItem._.slice(10) 
                            : dataItem._;
                        title = title.replace(/_/g, ' ');
                        //console.log("title change");
                    }
                    if (dataItem.$.key === keyMap['extra']) {
                        try {
                            // Parse the "extra" data as JSON
                            const extraData = JSON.parse(dataItem._);
                            // Extract the keys (e.g. V31, V146, M8699)
                            const extraKeys = Object.keys(extraData);
                            // Add the unique keys to the global set
                            extraKeys.forEach(key => globalExtrasList.add(key));
                        } catch (error) {
                            console.error("Error parsing 'extra' data for node:", node.$.id, error);
                        }
                    }
                });

                // Handle null, N/A, or empty text values
                if (!textValue || textValue === 'N/A' || textValue.trim() === '') {
                    nullOrEmptyTextCount++; // Increment null/empty counter
                }

                // Skip nodes if id is missing or invalid
                if (nodeId === 'N/A') {
                    console.warn(`Node with missing id found, skipping...`);
                    return;
                }

                // Create node object
                const nodeObject = {
                    id: nodeId,
                    text: textValue || 'N/A',  // Default to 'N/A' if text is missing
                    rank: rankValue || 0,      // Default to 0 if rank is missing
                    is_start: isStartValue || false,    // Default to false if is_start is missing
                    is_lemma: isLemmaValue || false,    // Default to false if is_lemma is missing
                    targets: []  // Initialize the targets array
                };

                nodeObjects.push(nodeObject);
                nodeMap[nodeId] = nodeObject; // Store the node in the map for quick lookup
            });


            // Sort node objects by their rank
            nodeObjects.sort((a, b) => a.rank - b.rank);

            edges.forEach(edge => {
                const sourceId = edge.$.source;
                // Push corresponding target into corresponding node's "targets" array.
                if (nodeMap[sourceId]) {
                    nodeMap[sourceId].targets.push(edge.$.target);  // Push the targetId into the targets array
                } else {
                    console.log("Error, source ID not found: " + sourceId);
                }
            });            
            
            // Create an object to count the nodes for each rank
            const rankCount = {};
            nodeObjects.forEach(node => {
                const rank = node.rank;
                if (rankCount[rank]) {
                    rankCount[rank]++;
                } else {
                    rankCount[rank] = 1;
                }
            });

            // Create an object to count the nodes for each outgoing target
            // Create an object to count the nodes for each outgoing target
            const targetCount = {};
            nodeObjects.forEach(node => {
                const targetT = node.targets.length;
                if (targetCount[targetT]) {
                    targetCount[targetT]++;
                } else {
                    targetCount[targetT] = 1;
                }
            });


            // Generate the constants for rank count and key map
            const rankCountString = JSON.stringify(rankCount, null, 4);
            const keyMapString = JSON.stringify(keyMap, null, 4);
            const occurrences = {};
                    for (const key in rankCount) {
                        const count = rankCount[key];
                        if (occurrences[count]) {
                            occurrences[count]++;
                        } else {
                            occurrences[count] = 1;
                        }
                    }
                    total = 0;
            const actual_time_zone_cuts = Object.values(occurrences).reduce((acc, value) => acc + value, 0)

            // Generate JavaScript content for section.js
            const jsContent = `
                const title = "${title}";
                const nodes = ${JSON.stringify(nodeObjects, null, 4)};
                const rankCount = ${rankCountString};
                const targetCount = ${JSON.stringify(targetCount, null, 4).replace(/"(\d+)":/g, '$1:')};
                const occurrences = ${JSON.stringify(occurrences, null, 4)};
                const actual_time_zone_cuts = ${actual_time_zone_cuts};
                const extrasList = ${JSON.stringify(Array.from(globalExtrasList), null, 4)};
                const keyMap = ${keyMapString};

                // Print all the required logs in order
                console.log("Section Tile:", title);
                console.log("Number of Nodes:", nodes.length);
                console.log("Where lemma is set true:", ${isLemmaCount});
                console.log("Occurrences (within ranks) :", occurrences);
                console.log("All columns (non-lemma included):",actual_time_zone_cuts);
                console.log("Node count by the number of outgoing targets they have:", targetCount);
                console.log("Nodes with null, N/A, or empty text values:", ${nullOrEmptyTextCount});
                console.log("Node count by rank:", rankCount);
                console.log("Keys map:", keyMap);
                console.log("Extracted extras:", extrasList);
            `;

            // Write the node objects, rank count, and key mappings to section.js
            fs.writeFile(jsFilePath, jsContent, (err) => {
                if (err) {
                    console.error('Error writing JS file:', err);
                    return;
                }
            });
        });
    });
    
    console.log(cunt + ' total conversions.');
}

// Run the function to process all section XML files
processAllSectionFiles();
