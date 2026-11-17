<?php
require_once __DIR__ . '/db.php';

try {
    $pdo = getDbConnection();
    
    $clientsCount = (int)$pdo->query('SELECT COUNT(*) FROM clients')->fetchColumn();
    $invoicesCount = (int)$pdo->query('SELECT COUNT(*) FROM invoices')->fetchColumn();
    $pricesCount = (int)$pdo->query('SELECT COUNT(*) FROM client_prices')->fetchColumn();

    echo json_encode([
        'ok' => true,
        'database' => $db_name,
        'status' => 'connected',
        'stats' => [
            'clients' => $clientsCount,
            'invoices' => $invoicesCount,
            'prices' => $pricesCount,
        ],
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
