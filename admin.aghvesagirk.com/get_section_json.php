<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

$fileId = isset($_GET['fileId']) ? $_GET['fileId'] : '';
$format = $_GET['format'] ?? 'json';
if (!is_string($fileId) || !preg_match('/^section-\d+$/', $fileId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid section id.']);
    exit;
}

if (!is_string($format) || !in_array($format, ['json', 'xml'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid section format.']);
    exit;
}

$directory = $format === 'xml' ? 'xml' : 'converted';
$contentType = $format === 'xml' ? 'application/xml' : 'application/json';
$fileName = $fileId . '.' . $format;
$baseDirs = [
    __DIR__ . '/' . $directory,
    dirname(__DIR__) . '/test.aghvesagirk.com/Lemma/' . $directory,
    dirname(__DIR__) . '/public_html/test.aghvesagirk.com/Lemma/' . $directory,
];

if (!empty($_SERVER['DOCUMENT_ROOT'])) {
    $baseDirs[] = dirname($_SERVER['DOCUMENT_ROOT']) . '/test.aghvesagirk.com/Lemma/' . $directory;
    $baseDirs[] = dirname($_SERVER['DOCUMENT_ROOT']) . '/public_html/test.aghvesagirk.com/Lemma/' . $directory;
}

foreach (array_unique($baseDirs) as $baseDir) {
    $candidate = $baseDir . '/' . $fileName;
    if (is_file($candidate) && is_readable($candidate)) {
        header('Content-Type: ' . $contentType . '; charset=UTF-8');
        readfile($candidate);
        exit;
    }
}

$remoteUrl = 'https://test.aghvesagirk.com/Lemma/' . $directory . '/' . rawurlencode($fileName);
$remoteData = false;

if (function_exists('curl_init')) {
    $ch = curl_init($remoteUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
    $remoteData = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($statusCode < 200 || $statusCode >= 300) {
        $remoteData = false;
    }
} elseif (ini_get('allow_url_fopen')) {
    $remoteData = @file_get_contents($remoteUrl);
}

$validRemoteData = false;
if (is_string($remoteData)) {
    if ($format === 'json') {
        $validRemoteData = json_decode($remoteData, true) !== null;
    } elseif (function_exists('simplexml_load_string')) {
        $previousErrors = libxml_use_internal_errors(true);
        $xml = simplexml_load_string($remoteData, 'SimpleXMLElement', LIBXML_NONET);
        $validRemoteData = $xml !== false && $xml->getName() === 'graphml';
        libxml_clear_errors();
        libxml_use_internal_errors($previousErrors);
    }
}

if ($validRemoteData) {
    header('Content-Type: ' . $contentType . '; charset=UTF-8');
    echo $remoteData;
    exit;
}

http_response_code(404);
echo json_encode([
    'error' => 'Section ' . strtoupper($format) . ' not found.',
    'fileId' => $fileId
]);
