<?php
header('Content-Type: application/json; charset=UTF-8');

$fileId = isset($_GET['fileId']) ? $_GET['fileId'] : '';
if (!preg_match('/^section-\d+$/', $fileId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid section id.']);
    exit;
}

$fileName = $fileId . '.json';
$baseDirs = [
    __DIR__ . '/converted',
    dirname(__DIR__) . '/test.aghvesagirk.com/Lemma/converted',
    dirname(__DIR__) . '/public_html/test.aghvesagirk.com/Lemma/converted',
];

if (!empty($_SERVER['DOCUMENT_ROOT'])) {
    $baseDirs[] = dirname($_SERVER['DOCUMENT_ROOT']) . '/test.aghvesagirk.com/Lemma/converted';
    $baseDirs[] = dirname($_SERVER['DOCUMENT_ROOT']) . '/public_html/test.aghvesagirk.com/Lemma/converted';
}

foreach (array_unique($baseDirs) as $baseDir) {
    $candidate = $baseDir . '/' . $fileName;
    if (is_file($candidate) && is_readable($candidate)) {
        readfile($candidate);
        exit;
    }
}

$remoteUrl = 'https://test.aghvesagirk.com/Lemma/converted/' . rawurlencode($fileName);
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
echo json_encode([
    'error' => 'Section JSON not found.',
    'fileId' => $fileId
]);
