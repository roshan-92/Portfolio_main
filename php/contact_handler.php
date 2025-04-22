<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'db_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Security headers
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

// CSRF Protection
session_start();
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Invalid CSRF token']);
        exit;
    }
}

// Rate Limiting
function checkRateLimit($ip) {
    $conn = getDBConnection();
    if (!$conn) return false;

    try {
        // Clean up old entries
        $stmt = $conn->prepare("DELETE FROM rate_limits WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");
        $stmt->execute();

        // Check current rate
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM rate_limits WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
        $stmt->execute([$ip]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result['count'] >= 5) {
            return false;
        }

        // Add new entry
        $stmt = $conn->prepare("INSERT INTO rate_limits (ip_address) VALUES (?)");
        $stmt->execute([$ip]);

        return true;
    } catch (PDOException $e) {
        error_log("Rate limit error: " . $e->getMessage());
        return false;
    }
}

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Check rate limit
if (!checkRateLimit($_SERVER['REMOTE_ADDR'])) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Too many requests. Please try again later.']);
    exit;
}

// Get and sanitize form data
$name = isset($_POST['name']) ? sanitizeInput($_POST['name']) : '';
$email = isset($_POST['email']) ? sanitizeInput($_POST['email']) : '';
$subject = isset($_POST['subject']) ? sanitizeInput($_POST['subject']) : '';
$message = isset($_POST['message']) ? sanitizeInput($_POST['message']) : '';

// Validate inputs
if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit;
}

if (!validateEmail($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Validate message length
if (strlen($message) < 10 || strlen($message) > 1000) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Message must be between 10 and 1000 characters']);
    exit;
}

// Check for spam keywords
$spamKeywords = ['viagra', 'casino', 'lottery', 'prize', 'winner'];
foreach ($spamKeywords as $keyword) {
    if (stripos($message, $keyword) !== false || stripos($subject, $keyword) !== false) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Your message was flagged as potential spam']);
        exit;
    }
}

// Get connection
$conn = getDBConnection();
if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

try {
    // Insert the message
    $stmt = $conn->prepare("INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $name,
        $email,
        $subject,
        $message,
        $_SERVER['REMOTE_ADDR'],
        $_SERVER['HTTP_USER_AGENT']
    ]);

    // Send email notification (optional)
    $to = "your-email@example.com"; // Change this to your email
    $emailSubject = "New Contact Form Submission: $subject";
    $emailBody = "Name: $name\nEmail: $email\nSubject: $subject\nMessage: $message";
    $headers = "From: $email";

    mail($to, $emailSubject, $emailBody, $headers);

    // Generate new CSRF token
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your message. We will get back to you soon!',
        'csrf_token' => $_SESSION['csrf_token']
    ]);

} catch (PDOException $e) {
    error_log("Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while saving your message'
    ]);
} 