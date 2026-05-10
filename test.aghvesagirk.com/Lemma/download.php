<?php
declare(strict_types=1);

$file = $_GET['file'] ?? '';

if (!is_string($file) || !preg_match('/^MS_[A-Za-z0-9_-]+\.zip$/', $file)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Invalid download request.';
    exit;
}

$remoteBaseUrl = getenv('AGIRK_DOWNLOAD_BASE_URL');
if (is_string($remoteBaseUrl) && trim($remoteBaseUrl) !== '') {
    $baseUrl = rtrim(trim($remoteBaseUrl), '/');
    header('Location: ' . $baseUrl . '/' . rawurlencode($file), true, 302);
    exit;
}

$path = __DIR__ . DIRECTORY_SEPARATOR . 'mZip' . DIRECTORY_SEPARATOR . $file;

if (!is_file($path) || !is_readable($path)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Missing';
    exit;
}

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $file . '"');
header('Content-Length: ' . (string) filesize($path));
header('X-Content-Type-Options: nosniff');

readfile($path);
