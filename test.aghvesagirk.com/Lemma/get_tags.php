<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

$candidateFiles = [
    dirname(__DIR__, 2) . '/admin.aghvesagirk.com/tags.json',
];

if (!empty($_SERVER['DOCUMENT_ROOT'])) {
    $documentRootParent = dirname($_SERVER['DOCUMENT_ROOT']);
    $candidateFiles[] = $documentRootParent . '/admin.aghvesagirk.com/tags.json';
    $candidateFiles[] = $documentRootParent . '/public_html/admin.aghvesagirk.com/tags.json';
}

foreach (array_unique($candidateFiles) as $candidateFile) {
    if (!is_file($candidateFile) || !is_readable($candidateFile)) {
        continue;
    }

    $json = file_get_contents($candidateFile);
    if ($json !== false && json_decode($json, true) !== null) {
        echo $json;
        exit;
    }
}

$remoteUrl = 'https://admin.aghvesagirk.com/tags.json';
$remoteJson = false;

if (function_exists('curl_init')) {
    $ch = curl_init($remoteUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
    $remoteJson = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($statusCode < 200 || $statusCode >= 300) {
        $remoteJson = false;
    }
} elseif (ini_get('allow_url_fopen')) {
    $remoteJson = @file_get_contents($remoteUrl);
}

if ($remoteJson !== false && json_decode($remoteJson, true) !== null) {
    echo $remoteJson;
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Tags JSON not found.']);
