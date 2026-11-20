<?php
require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT id, name, phone, category FROM clients ORDER BY created_at ASC');
    $clients = $stmt->fetchAll();
    echo json_encode($clients, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Client name is required']);
        exit;
    }

    $id = !empty($input['id']) ? $input['id'] : 'c_' . time() . '_' . rand(100, 999);
    $name = trim($input['name']);
    $phone = isset($input['phone']) ? trim($input['phone']) : '';
    $category = isset($input['category']) ? trim($input['category']) : 'عام';

    $stmt = $pdo->prepare('
        INSERT INTO clients (id, name, phone, category) 
        VALUES (:id, :name, :phone, :category)
        ON DUPLICATE KEY UPDATE 
            name = VALUES(name), 
            phone = VALUES(phone), 
            category = VALUES(category)
    ');
    $stmt->execute([
        ':id' => $id,
        ':name' => $name,
        ':phone' => $phone,
        ':category' => $category,
    ]);

    echo json_encode([
        'ok' => true,
        'client' => [
            'id' => $id,
            'name' => $name,
            'phone' => $phone,
            'category' => $category,
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Client ID is required']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM clients WHERE id = :id');
    $stmt->execute([':id' => $id]);

    // Also remove client custom prices
    $stmt2 = $pdo->prepare('DELETE FROM client_prices WHERE client_id = :id');
    $stmt2->execute([':id' => $id]);

    // Record tombstone in settings table so sync will NEVER restore it
    try {
        $delClientStmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'deleted_clients'");
        $storedDeletedClients = json_decode($delClientStmt->fetchColumn() ?: '[]', true) ?: [];
        if (!in_array($id, $storedDeletedClients, true)) {
            $storedDeletedClients[] = $id;
            $stmtUpd = $pdo->prepare("
                INSERT INTO settings (setting_key, setting_value)
                VALUES ('deleted_clients', :val)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            ");
            $stmtUpd->execute([':val' => json_encode(array_values($storedDeletedClients), JSON_UNESCAPED_UNICODE)]);
        }
    } catch (Exception $e) {}

    echo json_encode(['ok' => true, 'deleted_id' => $id]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
