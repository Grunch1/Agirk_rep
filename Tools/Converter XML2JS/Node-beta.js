const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const outputDirectoryPath = path.join(__dirname, 'converted');

const errorLogPath = path.join(__dirname, 'Node-beta-errors.log');
const runStartedAt = new Date().toISOString();
let hasLoggedIssue = false;

function reportIssue(message, error = null, context = {}, isWarning = false, logPath = errorLogPath) {
    const contextText = Object.keys(context).length ? ` ${JSON.stringify(context)}` : '';
    const consoleArguments = [message + contextText];
    if (error) consoleArguments.push(error);
    if (isWarning) {
        console.warn(...consoleArguments);
    } else {
        console.error(...consoleArguments);
    }

    const runHeader = hasLoggedIssue ? '' : `\n--- Conversion run started: ${runStartedAt} ---\n`;
    const errorDetails = error ? `\n${error.stack || String(error)}` : '';
    const entry = `[${new Date().toISOString()}] [${isWarning ? 'WARNING' : 'ERROR'}] ${message}${contextText}${errorDetails}\n\n`;

    try {
        fs.appendFileSync(logPath, runHeader + entry, 'utf8');
        if (!hasLoggedIssue) {
            hasLoggedIssue = true;
            console.log('Errors and warnings saved to:', logPath);
        }
    } catch (logError) {
        console.error('Error writing error log file:', logPath, logError);
    }
}

function hasUsableText(value) {
    return typeof value === 'string' && value.trim() !== '' && value.trim() !== 'N/A';
}

function withErrorLogging(xmlFileName, callback, onError, logIssue) {
    return (...args) => {
        try {
            callback(...args);
        } catch (error) {
            logIssue('Error converting XML file:', error, { file: xmlFileName });
            onError();
        }
    };
}

// Find & Convert all XML files starting with 'section'
function processAllSectionFiles(options = {}) {
    const directoryPath = path.join(__dirname, '..', 'LegacyXMLData');
    const format = options.format || 'js';
    const outputDirectory = options.outputDirectory || outputDirectoryPath;
    const logIssue = (message, error, context, isWarning) =>
        reportIssue(message, error, context, isWarning, options.errorLogPath || errorLogPath);
    if (format !== 'js' && format !== 'json') throw new Error('Unsupported output format: ' + format);
    try {
        fs.mkdirSync(outputDirectory, { recursive: true });
    } catch (error) {
        logIssue('Error creating output directory:', error, { directory: outputDirectory });
        return;
    }

    // Read all files in the current directory
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            logIssue('Error reading directory:', err, { directory: directoryPath });
            return;
        }
        // Filter for files starting with 'section' and ending with '.xml'
        const xmlFiles = files.filter(file => file.startsWith('section') && file.endsWith('.xml'));
        console.log(xmlFiles);

        if (xmlFiles.length === 0) {
            console.log('Converted 0 of 0 XML files.');
            return;
        }

        let completedCount = 0;
        let successfulCount = 0;
        let nextFileIndex = 0;
        const onComplete = success => {
            completedCount++;
            if (success) successfulCount++;
            if (completedCount === xmlFiles.length) {
                console.log(`Converted ${successfulCount} of ${xmlFiles.length} XML files.`);
            } else {
                processNextFile();
            }
        };

        function processNextFile() {
            if (nextFileIndex >= xmlFiles.length) return;
            parseXMLAndGenerateFile(xmlFiles[nextFileIndex++], onComplete, format, outputDirectory, logIssue);
        }
        
        // Process each filtered XML file
        // Limit files in flight so a run does not load every XML file into memory at once.
        const workerCount = Math.min(4, xmlFiles.length);
        for (let worker = 0; worker < workerCount; worker++) processNextFile();
    });
}

// Function that Converts gathered XML --> JS objects
function parseXMLAndGenerateFile(xmlFileName, onComplete, format, outputDirectory, logIssue) {
     // Use the xmlFileName dynamically for each file
     const xmlFilePath = path.join(__dirname, '..', 'LegacyXMLData', xmlFileName);  // Full path for the XML file
     const outputFileName = xmlFileName.replace(/\.xml$/, '.' + format);  // Create corresponding output file name
     const outputFilePath = path.join(outputDirectory, outputFileName);    // Full path for the output file

    // Read the section.xml file
    fs.readFile(xmlFilePath, 'utf8', (err, data) => {
        if (err) {
            logIssue('Error reading XML file:', err, { file: xmlFileName });
            onComplete(false);
            return;
        }

        // Parse the XML data
        xml2js.parseString(data, withErrorLogging(xmlFileName, (err, result) => {
            if (err) {
                logIssue('Error parsing XML file:', err, { file: xmlFileName });
                onComplete(false);
                return;
            }

            // Initializing  ...
            const keys = result['graphml']['key']; // Get the list of keys
            const graph = result['graphml']['graph'][0];
            const nodes = graph['node'] || []; // Get the list of nodes
            const edges = graph['edge'] || []; // Get the list of edges
            const nodeObjects = []; // Creates A Single Node
            const nodeMap = new Map(); // my nodes for quick look-up
            const sourceNodeIds = new Set();
            const keyMap = Object.create(null);  // my keys  for quick look-up
            const nodeKeyNames = Object.create(null);
            let nullOrEmptyTextCount = 0;  // Initialize count for null, N/A, or empty text values
            let normalFormFallbackCount = 0;
            let excludedStructuralNodeCount = 0;
            let title = "Unknown";  // Initialize the constant for the 'name' key
            const globalExtrasList = new Set(); // List to hold all extracted "extra" values

            // Create a dynamic mapping of attribute names to their respective key IDs
            keys.forEach(key => {
                const attrName = key.$['attr.name'];
                const id = key.$.id;
                // Prefer node keys when node and edge attributes share a name (e.g., neolabel).
                if (key.$.for !== 'edge' || !keyMap[attrName]) keyMap[attrName] = id;
                if (key.$.for !== 'edge') nodeKeyNames[id] = attrName;
            });
            
            // Iterate through each node and extract required data dynamically
            nodes.forEach(node => {
                const nodeId = (node.$ && node.$.id) || 'N/A'; // Use 'N/A' if id is missing or invalid
                const nodeData = Object.create(null);

                // Iterate through the data tags and extract values based on dynamic keys
                (node.data || []).forEach(dataItem => {
                    const attrName = nodeKeyNames[dataItem.$.key];
                    if (attrName) nodeData[attrName] = dataItem._;
                });

                // Extract 'name' from dn1 aka Title
                if (Object.prototype.hasOwnProperty.call(nodeData, 'name')) {
                    const name = nodeData.name || 'Unknown';
                    title = name.startsWith("milestone-") ? name.slice(10) : name;
                    title = title.replace(/_/g, ' ');
                    //console.log("title change");
                }

                // Skip nodes if id is missing or invalid
                if (nodeId === 'N/A') {
                    logIssue('Node with missing id found, skipping...', null, { file: xmlFileName }, true);
                    return;
                }
                sourceNodeIds.add(nodeId);

                const isSectionValue = nodeData.neolabel === '[SECTION]' || nodeId === graph.$.id;
                const isStartValue = nodeData.is_start === 'true' || nodeData.text === '#START#';
                const isEndValue = nodeData.is_end === 'true' || nodeData.text === '#END#';
                // Export only readings; preserve section metadata separately.
                if (isSectionValue || isStartValue || isEndValue) {
                    excludedStructuralNodeCount++;
                    return;
                }

                const hasNormalForm = hasUsableText(nodeData.normal_form);
                const hasOriginalText = hasUsableText(nodeData.text);
                const textValue = hasNormalForm ? nodeData.normal_form : hasOriginalText ? nodeData.text : 'N/A';
                const rankValue = parseInt(nodeData.rank, 10) || 0; // Default to 0 if rank is missing or invalid
                const isLemmaValue = nodeData.is_lemma === 'true'; // Extract is_lemma as a boolean

                if (!hasNormalForm && hasOriginalText) normalFormFallbackCount++;
                // Handle null, N/A, or empty text values
                if (!hasNormalForm && !hasOriginalText) {
                    nullOrEmptyTextCount++;
                    logIssue('Reading node has no usable normal_form or text:', null,
                        { file: xmlFileName, nodeId }, true);
                }

                if (Object.prototype.hasOwnProperty.call(nodeData, 'extra')) {
                    try {
                        // Parse the "extra" data as JSON
                        const extraData = JSON.parse(nodeData.extra);
                        // Extract the keys (e.g. V31, V146, M8699)
                        const extraKeys = Object.keys(extraData);
                        // Add the unique keys to the global set
                        extraKeys.forEach(key => globalExtrasList.add(key));
                    } catch (error) {
                        logIssue("Error parsing 'extra' data for node:", error, { file: xmlFileName, nodeId });
                    }
                }

                // Create node object
                const nodeObject = {
                    id: nodeId,
                    text: textValue,  // Prefer normal_form, then original text; default to 'N/A' if both are missing
                    ...(format === 'json' ? { normal_form: hasNormalForm ? nodeData.normal_form : '' } : {}),
                    rank: rankValue || 0,      // Default to 0 if rank is missing
                    is_start: isStartValue || false,    // Default to false if is_start is missing
                    is_end: isEndValue,
                    is_section: isSectionValue,
                    is_lemma: isLemmaValue || false,    // Default to false if is_lemma is missing
                    targets: []  // Initialize the targets array
                };

                nodeObjects.push(nodeObject);
                nodeMap.set(nodeId, nodeObject); // Store the node in the map for quick lookup
            });


            // Sort node objects by their rank
            nodeObjects.sort((a, b) => a.rank - b.rank);

            edges.forEach(edge => {
                const sourceId = edge.$.source;
                const targetId = edge.$.target;
                if (!sourceNodeIds.has(sourceId)) {
                    logIssue('Error, source ID not found: ' + sourceId, null, { file: xmlFileName, targetId });
                }
                if (!sourceNodeIds.has(targetId)) {
                    logIssue('Error, target ID not found: ' + targetId, null, { file: xmlFileName, sourceId });
                }
                // Push corresponding target into corresponding node's "targets" array.
                const sourceNode = nodeMap.get(sourceId);
                if (sourceNode && nodeMap.has(targetId)) {
                    sourceNode.targets.push(targetId);  // Push the targetId into the targets array
                }
            });            

            // Create an object to count the nodes for each rank
            const rankCount = {};
            // Count outgoing links between the exported readings.
            const targetCount = {};
            let isLemmaCount = 0; // Initialize count for [is_lemma true] values
            nodeObjects.forEach(node => {
                rankCount[node.rank] = (rankCount[node.rank] || 0) + 1;
                targetCount[node.targets.length] = (targetCount[node.targets.length] || 0) + 1;
                if (node.is_lemma) isLemmaCount++;
            });


            // Generate the constants for rank count and key map
            const occurrences = {};
            for (const count of Object.values(rankCount)) {
                occurrences[count] = (occurrences[count] || 0) + 1;
            }
            const actual_time_zone_cuts = Object.keys(rankCount).length;
            const sectionId = 'section-' + graph.$.id;
            const sourceNodeCount = nodes.length;
            const extrasList = Array.from(globalExtrasList);

            // Generate JSON or JavaScript content for the section
            const outputContent = format === 'json' ? JSON.stringify({
                sectionId,
                title,
                nodes: nodeObjects,
                sourceNodeCount,
                excludedStructuralNodeCount,
                isLemmaCount,
                nullOrEmptyTextCount,
                normalFormFallbackCount,
                rankCount,
                targetCount,
                occurrences,
                actual_time_zone_cuts,
                extrasList,
                keyMap,
            }, null, 4) : `
                const sectionId = ${JSON.stringify(sectionId)};
                const title = ${JSON.stringify(title)};
                const nodes = ${JSON.stringify(nodeObjects, null, 4)};
                const sourceNodeCount = ${sourceNodeCount};
                const excludedStructuralNodeCount = ${excludedStructuralNodeCount};
                const rankCount = ${JSON.stringify(rankCount, null, 4)};
                const targetCount = ${JSON.stringify(targetCount, null, 4).replace(/"(\d+)":/g, '$1:')};
                const occurrences = ${JSON.stringify(occurrences, null, 4)};
                const actual_time_zone_cuts = ${actual_time_zone_cuts};
                const extrasList = ${JSON.stringify(extrasList, null, 4)};
                const keyMap = ${JSON.stringify(keyMap, null, 4)};

                // Print all the required logs in order
                console.log("Section Title:", title);
                console.log("Total source graph nodes:", sourceNodeCount);
                console.log("Reading nodes:", nodes.length);
                console.log("Excluded structural nodes (section/start/end):", excludedStructuralNodeCount);
                console.log("Reading nodes where lemma is set true:", ${isLemmaCount});
                console.log("Occurrences (within ranks) :", occurrences);
                console.log("Reading columns (non-lemma included):", actual_time_zone_cuts);
                console.log("Reading node count by outgoing reading targets (structural targets excluded):", targetCount);
                console.log("Reading nodes with null, N/A, or empty text values:", ${nullOrEmptyTextCount});
                console.log("Reading nodes using original text because normal_form is missing:", ${normalFormFallbackCount});
                console.log("Reading node count by rank:", rankCount);
                console.log("Keys map:", keyMap);
                console.log("Extracted extras:", extrasList);
            `;

            // Write the node objects, rank count, and key mappings to the output file
            fs.writeFile(outputFilePath, outputContent, 'utf8', (err) => {
                if (err) {
                    logIssue('Error writing ' + format.toUpperCase() + ' file:', err, { file: xmlFileName, outputFile: outputFileName });
                    onComplete(false);
                    return;
                }
                onComplete(true);
            });
        }, () => onComplete(false), logIssue));
    });
    
}

// Run the function to process all section XML files
if (require.main === module) processAllSectionFiles();

module.exports = { processAllSectionFiles };
