<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();

// Generate new CSRF token if not exists
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

echo json_encode(['csrf_token' => $_SESSION['csrf_token']]); 