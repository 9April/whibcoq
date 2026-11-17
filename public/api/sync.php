<?php
require_once __DIR__ . '/db.php';

$pdo = getDbConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    // 1. Sync clients if sent
    if (!empty($input['clients']) && is_array($input['clients'])) {
        $stmtClient = $pdo->prepare('
            INSERT INTO clients (id, name, phone, category)
            VALUES (:id, :name, :phone, :category)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                phone = VALUES(phone),
                category = VALUES(category)
        ');
        foreach ($input['clients'] as $c) {
            if (!empty($c['id']) && !empty($c['name'])) {
                $stmtClient->execute([
                    ':id' => $c['id'],
                    ':name' => $c['name'],
                    ':phone' => $c['phone'] ?? '',
                    ':category' => $c['category'] ?? 'عام',
                ]);
            }
        }
    }

    // 2. Sync invoices if sent
    if (!empty($input['invoices']) && is_array($input['invoices'])) {
        $stmtInv = $pdo->prepare('
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
        foreach ($input['invoices'] as $inv) {
            if (!empty($inv['id'])) {
                $items = isset($inv['items']) ? (is_string($inv['items']) ? $inv['items'] : json_encode($inv['items'], JSON_UNESCAPED_UNICODE)) : '[]';
                $stmtInv->execute([
                    ':id' => $inv['id'],
                    ':client_id' => $inv['clientId'] ?? 'c_default',
                    ':client_name' => $inv['clientName'] ?? 'زبون عام',
                    ':client_phone' => $inv['clientPhone'] ?? '',
                    ':date' => $inv['date'] ?? date('Y-m-d'),
                    ':total_weight' => (float)($inv['totalWeight'] ?? 0),
                    ':total_amount' => (float)($inv['totalAmount'] ?? 0),
                    ':items' => $items,
                    ':timestamp' => (int)($inv['timestamp'] ?? (time() * 1000)),
                ]);
            }
        }
    }

    // 3. Sync prices if sent
    if (!empty($input['prices']) && is_array($input['prices'])) {
        $stmtPrice = $pdo->prepare('
            INSERT INTO client_prices (client_id, product_id, price)
            VALUES (:client_id, :product_id, :price)
            ON DUPLICATE KEY UPDATE price = VALUES(price)
        ');
        foreach ($input['prices'] as $key => $price) {
            $parts = explode('_', $key, 2);
            if (count($parts) === 2) {
                $stmtPrice->execute([
                    ':client_id' => $parts[0],
                    ':product_id' => $parts[1],
                    ':price' => (float)$price,
                ]);
            }
        }
    }

    // 4. Sync admin credentials if sent
    $newPass = !empty($input['adminPassword']) ? $input['adminPassword'] : (!empty($input['adminPin']) ? $input['adminPin'] : null);
    if (!empty($newPass) && $newPass !== '1234') {
        $stmtPass = $pdo->prepare("
            INSERT INTO settings (setting_key, setting_value)
            VALUES ('admin_password', :pass)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        ");
        $stmtPass->execute([':pass' => (string)$newPass]);

        $stmtPin = $pdo->prepare("
            INSERT INTO settings (setting_key, setting_value)
            VALUES ('admin_pin', :pin)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        ");
        $stmtPin->execute([':pin' => (string)$newPass]);
    }

    if (!empty($input['adminUser'])) {
        $stmtUser = $pdo->prepare("
            INSERT INTO settings (setting_key, setting_value)
            VALUES ('admin_user', :user)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        ");
        $stmtUser->execute([':user' => (string)$input['adminUser']]);
    }

    // Now return full database state to synchronize the client
    $clients = $pdo->query('SELECT id, name, phone, category FROM clients ORDER BY created_at ASC')->fetchAll();
    
    $invRows = $pdo->query('SELECT id, client_id as clientId, client_name as clientName, client_phone as clientPhone, date, total_weight as totalWeight, total_amount as totalAmount, items, timestamp FROM invoices ORDER BY timestamp DESC')->fetchAll();
    $invoices = array_map(function($row) {
        $row['totalWeight'] = (float)$row['totalWeight'];
        $row['totalAmount'] = (float)$row['totalAmount'];
        $row['timestamp'] = (int)$row['timestamp'];
        if (is_string($row['items'])) {
            $row['items'] = json_decode($row['items'], true) ?: [];
        }
        return $row;
    }, $invRows);

    $priceRows = $pdo->query('SELECT client_id, product_id, price FROM client_prices')->fetchAll();
    $prices = [];
    foreach ($priceRows as $pr) {
        $prices[$pr['client_id'] . '_' . $pr['product_id']] = (float)$pr['price'];
    }

    // Load single authoritative credentials
    $userStmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'admin_user'");
    $adminUser = $userStmt->fetchColumn() ?: 'wahib';

    $passStmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'admin_password'");
    $adminPassword = $passStmt->fetchColumn();
    if (!$adminPassword) {
        $pinStmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'admin_pin'");
        $adminPassword = $pinStmt->fetchColumn() ?: '12345';
    }

    echo json_encode([
        'ok' => true,
        'database' => $db_name,
        'clients' => $clients,
        'invoices' => $invoices,
        'prices' => $prices,
        'adminUser' => $adminUser,
        'adminPassword' => $adminPassword,
        'adminPin' => $adminPassword,
        'syncedAt' => time(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
