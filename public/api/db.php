<?php
// WAHIB COQ - Database Connection
// Hostinger MySQL Configuration

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db_host = getenv('DB_HOST') ?: '127.0.0.1';
$db_port = getenv('DB_PORT') ?: 3306;
$db_name = getenv('DB_NAME') ?: 'u895506237_wahib';
$db_user = getenv('DB_USER') ?: 'u895506237_wahib';
$db_pass = getenv('DB_PASSWORD') ?: '9uMCumV/';

function getDbConnection() {
    global $db_host, $db_port, $db_name, $db_user, $db_pass;
    
    // First try local connection (standard for Hostinger web server)
    try {
        $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
        $pdo = new PDO($dsn, $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 3,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        // If 127.0.0.1 fails, try remote host srv898.hstgr.io
        if ($db_host !== 'srv898.hstgr.io') {
            try {
                $dsnRemote = "mysql:host=srv898.hstgr.io;port=3306;dbname={$db_name};charset=utf8mb4";
                $pdoRemote = new PDO($dsnRemote, $db_user, $db_pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_TIMEOUT => 4,
                ]);
                return $pdoRemote;
            } catch (PDOException $e2) {
                // fall through to error
            }
        }
        
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'error' => 'Database connection failed: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
