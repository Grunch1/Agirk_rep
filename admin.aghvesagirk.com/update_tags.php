<?php
// update_tags.php

header('Content-Type: application/json');

// Read the JSON payload from the POST request.
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['group']) || !isset($input['node'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameters.']);
    exit;
}

$group = $input['group'];
$node = $input['node'];

// Path to your JSON file
$jsonFile = 'tags.json';

// Ensure the file exists. If not, create one with the default structure.
if (!file_exists($jsonFile)) {
    $defaultData = [
        "Locations"   => [],
        "Individuals" => [],
        "Animals"     => [],
        "Dates"       => [],
        "References"  => [],
        "Footnotes"   => []
    ];
    file_put_contents($jsonFile, json_encode($defaultData, JSON_PRETTY_PRINT));
}

// Read and decode the existing JSON file.
$jsonData = file_get_contents($jsonFile);
$data = json_decode($jsonData, true);
if (!is_array($data)) {
    $data = [
        "Locations"   => [],
        "Individuals" => [],
        "Animals"     => [],
        "Dates"       => [],
        "References"  => [],
        "Footnotes"   => []
    ];
}

// Validate the group exists.
if (!isset($data[$group])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid group specified.']);
    exit;
}

// Optionally, check for duplicates using the 'text' as the unique key.
foreach ($data[$group] as $item) {
    if (isset($item['text']) && $item['text'] === $node['text']) {
        http_response_code(400);
        echo json_encode(['error' => 'Tag with that text already exists in ' . $group]);
        exit;
    }
}

// Append the new node to the specified group.
$data[$group][] = $node;

// Save the updated JSON data back to the file.
if (file_put_contents($jsonFile, json_encode($data, JSON_PRETTY_PRINT)) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to write to file.']);
    exit;
}

echo json_encode(['success' => true, 'data' => $data]);
