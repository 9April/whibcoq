<?php
require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT client_id, product_id, price FROM client_prices');
    $rows = $stmt->fetchAll();
    
    $pricesMap = [];
    foreach ($rows as $row) {
        $key = $row['client_id'] . '_' . $row['product_id'];
        $pricesMap[$key] = (float)$row['price'];
    }

    echo json_encode($pricesMap, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['clientId']) || !isset($input['productId']) || !isset($input['price'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'clientId, productId and price are required']);
        exit;
    }

    $clientId = trim($input['clientId']);
    $productId = trim($input['productId']);
    $price = (float)$input['price'];

    $stmt = $pdo->prepare('
        INSERT INTO client_prices (client_id, product_id, price)
        VALUES (:client_id, :product_id, :price)
        ON DUPLICATE KEY UPDATE price = VALUES(price)
    ');
    $stmt->execute([
        ':client_id' => $clientId,
        ':product_id' => $productId,
        ':price' => $price,
    ]);

    echo json_encode(['ok' => true, 'key' => "{$clientId}_{$productId}", 'price' => $price]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
