<?php
require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $key = $_GET['key'] ?? null;
    if ($key) {
        $stmt = $pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = :key');
        $stmt->execute([':key' => $key]);
        $val = $stmt->fetchColumn();
        echo json_encode(['key' => $key, 'value' => $val !== false ? $val : null], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->query('SELECT setting_key, setting_value FROM settings');
    $all = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    echo json_encode($all, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['key'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Setting key is required']);
        exit;
    }

    $key = trim($input['key']);
    $value = isset($input['value']) ? (string)$input['value'] : '';

    $stmt = $pdo->prepare('
        INSERT INTO settings (setting_key, setting_value)
        VALUES (:key, :value)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    ');
    $stmt->execute([
        ':key' => $key,
        ':value' => $value,
    ]);

    echo json_encode(['ok' => true, 'key' => $key, 'value' => $value]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
