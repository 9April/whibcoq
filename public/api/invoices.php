<?php
require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT id, client_id as clientId, client_name as clientName, client_phone as clientPhone, date, total_weight as totalWeight, total_amount as totalAmount, items, timestamp FROM invoices ORDER BY timestamp DESC');
    $rows = $stmt->fetchAll();
    
    // Parse items JSON safely
    $invoices = array_map(function($row) {
        $rawItems = is_string($row['items']) ? json_decode($row['items'], true) : $row['items'];
        $items = [];
        $computedWeight = 0.0;
        $computedAmount = 0.0;
        if (is_array($rawItems)) {
            foreach ($rawItems as $it) {
                $w = (float)($it['weight'] ?? 0);
                $p = (float)($it['price'] ?? 0);
                $t = isset($it['total']) && $it['total'] !== '' ? (float)$it['total'] : ($w * $p);
                $computedWeight += $w;
                $computedAmount += $t;
                $it['weight'] = $w;
                $it['price'] = $p;
                $it['total'] = $t;
                $items[] = $it;
            }
        }
        $row['totalWeight'] = count($items) > 0 ? $computedWeight : (float)$row['totalWeight'];
        $row['totalAmount'] = count($items) > 0 ? $computedAmount : (float)$row['totalAmount'];
        $row['timestamp'] = (int)$row['timestamp'];
        $row['items'] = $items;
        return $row;
    }, $rows);

    echo json_encode($invoices, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invoice data is invalid']);
        exit;
    }

    $id = trim($input['id']);
    $clientId = $input['clientId'] ?? 'c_default';
    $clientName = $input['clientName'] ?? 'زبون عام';
    $clientPhone = $input['clientPhone'] ?? '';
    $date = $input['date'] ?? date('Y-m-d');
    $totalWeight = (float)($input['totalWeight'] ?? 0);
    $totalAmount = (float)($input['totalAmount'] ?? 0);
    $items = isset($input['items']) ? (is_string($input['items']) ? $input['items'] : json_encode($input['items'], JSON_UNESCAPED_UNICODE)) : '[]';
    $timestamp = isset($input['timestamp']) ? (int)$input['timestamp'] : (time() * 1000);

    $stmt = $pdo->prepare('
        INSERT INTO invoices (id, client_id, client_name, client_phone, date, total_weight, total_amount, items, timestamp)
        VALUES (:id, :client_id, :client_name, :client_phone, :date, :total_weight, :total_amount, :items, :timestamp)
        ON DUPLICATE KEY UPDATE
            client_id = VALUES(client_id),
            client_name = VALUES(client_name),
            client_phone = VALUES(client_phone),
            date = VALUES(date),
            total_weight = VALUES(total_weight),
            total_amount = VALUES(total_amount),
            items = VALUES(items),
            timestamp = VALUES(timestamp)
    ');

    $stmt->execute([
        ':id' => $id,
        ':client_id' => $clientId,
        ':client_name' => $clientName,
        ':client_phone' => $clientPhone,
        ':date' => $date,
        ':total_weight' => $totalWeight,
        ':total_amount' => $totalAmount,
        ':items' => $items,
        ':timestamp' => $timestamp,
    ]);

    echo json_encode(['ok' => true, 'id' => $id]);
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
        echo json_encode(['ok' => false, 'error' => 'Invoice ID is required']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM invoices WHERE id = :id');
    $stmt->execute([':id' => $id]);

    echo json_encode(['ok' => true, 'deleted_id' => $id]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
