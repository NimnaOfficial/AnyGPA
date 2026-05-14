<?php
// api.php - ANY GPA CORE REST API
require 'db.php';

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// ROUTE 1: Load Global Systems
if ($action === 'get_systems') {
    $stmt = $pdo->query("SELECT * FROM grading_systems WHERE is_public = 1");
    echo json_encode($stmt->fetchAll());
    exit;
}

// ROUTE 2: Load Specific Rules
if ($action === 'get_rules') {
    $system_id = isset($_GET['id']) ? (int)$_GET['id'] : 1;
    $stmt = $pdo->prepare("SELECT grade_letter, point_value FROM grade_rules WHERE system_id = ? ORDER BY point_value DESC");
    $stmt->execute([$system_id]);
    echo json_encode($stmt->fetchAll());
    exit;
}

// ROUTE 3: Create Custom Strategy
if ($action === 'create_system' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $sysName = trim($input['system_name'] ?? '');
    $sysCountry = trim($input['country'] ?? '');
    $customRules = $input['custom_rules'] ?? []; 
    
    if (empty($sysName) || empty($sysCountry) || empty($customRules)) {
        echo json_encode(['error' => 'Incomplete data payload.']);
        exit;
    }

    try {
        $pdo->beginTransaction(); // Transaction ensures no corrupted half-saves

        $stmt = $pdo->prepare("INSERT INTO grading_systems (system_name, country, is_public) VALUES (?, ?, 1)");
        $stmt->execute([$sysName, $sysCountry]);
        $newSystemId = $pdo->lastInsertId();
        
        $ruleStmt = $pdo->prepare("INSERT INTO grade_rules (system_id, grade_letter, point_value) VALUES (?, ?, ?)");
        foreach ($customRules as $rule) {
            $grade = trim($rule['grade_letter'] ?? '');
            $points = floatval($rule['point_value'] ?? 0);
            if (!empty($grade)) {
                $ruleStmt->execute([$newSystemId, $grade, $points]);
            }
        }
        
        $pdo->commit(); 
        echo json_encode(['success' => true, 'message' => 'Strategy Deployed Globally!', 'id' => $newSystemId]);
        exit;
    } catch(PDOException $e) {
        $pdo->rollBack(); 
        echo json_encode(['error' => 'Database exception: ' . $e->getMessage()]);
        exit;
    }
}

// ROUTE 4: Secure Admin Verification
if ($action === 'verify_admin' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (($input['username'] ?? '') === '0000' && ($input['password'] ?? '') === '0000') {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'ACCESS DENIED.']);
    }
    exit;
}

// ROUTE 5: Secure System Purge
if ($action === 'delete_system' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (($input['username'] ?? '') !== '0000' || ($input['password'] ?? '') !== '0000') {
        echo json_encode(['error' => 'Unauthorized operation.']);
        exit;
    }

    $system_id = isset($input['id']) ? (int)$input['id'] : 0;
    try {
        $stmt = $pdo->prepare("DELETE FROM grading_systems WHERE system_id = ?");
        $stmt->execute([$system_id]);
        echo json_encode(['success' => true, 'message' => 'System purged.']);
        exit;
    } catch(PDOException $e) {
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

echo json_encode(['error' => 'Invalid API Route']);
?>