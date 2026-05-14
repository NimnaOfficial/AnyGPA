<?php
// =====================================================================
// ANY GPA CORE: ENTERPRISE REST API
// =====================================================================

require 'db.php';

// --- 1. ENTERPRISE SECURITY & CORS HEADERS ---
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Handle preflight requests instantly
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- 2. PAYLOAD EXTRACTION & SANITIZATION ---
$action = isset($_GET['action']) ? filter_var(trim($_GET['action']), FILTER_SANITIZE_STRING) : '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// --- 3. HIGH-PERFORMANCE ROUTER ---
switch ($action) {

    // ---------------------------------------------------------
    // ROUTE: Fetch Global Public Systems
    // ---------------------------------------------------------
    case 'get_systems':
        try {
            $stmt = $pdo->query("SELECT system_id, system_name, country FROM grading_systems WHERE is_public = 1 ORDER BY system_id ASC");
            http_response_code(200);
            echo json_encode($stmt->fetchAll());
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database Query Failed.']);
        }
        break;

    // ---------------------------------------------------------
    // ROUTE: Fetch Specific Grading Rules
    // ---------------------------------------------------------
    case 'get_rules':
        $system_id = isset($_GET['id']) ? (int)$_GET['id'] : 1;
        try {
            $stmt = $pdo->prepare("SELECT grade_letter, point_value FROM grade_rules WHERE system_id = ? ORDER BY point_value DESC");
            $stmt->execute([$system_id]);
            http_response_code(200);
            echo json_encode($stmt->fetchAll());
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to retrieve rules.']);
        }
        break;

    // ---------------------------------------------------------
    // ROUTE: Deploy Custom Strategy (Transactional)
    // ---------------------------------------------------------
    case 'create_system':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed.']);
            exit;
        }

        $sysName = trim($input['system_name'] ?? '');
        $sysCountry = trim($input['country'] ?? '');
        $customRules = $input['custom_rules'] ?? []; 
        
        if (empty($sysName) || empty($sysCountry) || empty($customRules) || !is_array($customRules)) {
            http_response_code(400);
            echo json_encode(['error' => 'Incomplete data payload. Mission Aborted.']);
            exit;
        }

        try {
            // Transaction Lock: Ensures system and rules save together, or not at all.
            $pdo->beginTransaction(); 

            // 1. Register System
            $stmt = $pdo->prepare("INSERT INTO grading_systems (system_name, country, is_public) VALUES (?, ?, 1)");
            $stmt->execute([$sysName, $sysCountry]);
            $newSystemId = $pdo->lastInsertId();
            
            // 2. Map Dynamic Rules
            $ruleStmt = $pdo->prepare("INSERT INTO grade_rules (system_id, grade_letter, point_value) VALUES (?, ?, ?)");
            foreach ($customRules as $rule) {
                $grade = trim(filter_var($rule['grade_letter'] ?? '', FILTER_SANITIZE_STRING));
                $points = floatval($rule['point_value'] ?? 0);
                
                if ($grade !== '') {
                    $ruleStmt->execute([$newSystemId, $grade, $points]);
                }
            }
            
            // 3. Commit to permanent memory
            $pdo->commit(); 
            http_response_code(201); // 201 Created
            echo json_encode(['success' => true, 'message' => 'Strategy Deployed Globally!', 'id' => $newSystemId]);

        } catch(PDOException $e) {
            $pdo->rollBack(); 
            http_response_code(500);
            echo json_encode(['error' => 'Data Integrity Fault: ' . $e->getMessage()]);
        }
        break;

    // ---------------------------------------------------------
    // ROUTE: God Mode Authentication
    // ---------------------------------------------------------
    case 'verify_admin':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed.']);
            exit;
        }

        $user = $input['username'] ?? '';
        $pass = $input['password'] ?? '';

        // Strict Master Identity Check
        if ($user === '0000' && $pass === '0000') {
            http_response_code(200);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(401); // 401 Unauthorized
            echo json_encode(['error' => 'ACCESS DENIED. Invalid Credentials.']);
        }
        break;

    // ---------------------------------------------------------
    // ROUTE: God Mode System Purge
    // ---------------------------------------------------------
    case 'delete_system':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed.']);
            exit;
        }

        $user = $input['username'] ?? '';
        $pass = $input['password'] ?? '';

        // Double verification before destructive action
        if ($user !== '0000' || $pass !== '0000') {
            http_response_code(403); // 403 Forbidden
            echo json_encode(['error' => 'Unauthorized operation. Breach logged.']);
            exit;
        }

        $system_id = isset($input['id']) ? (int)$input['id'] : 0;
        
        try {
            $stmt = $pdo->prepare("DELETE FROM grading_systems WHERE system_id = ?");
            $stmt->execute([$system_id]);
            
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'System purged from existence.']);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Core Deletion Failed: ' . $e->getMessage()]);
        }
        break;

    // ---------------------------------------------------------
    // FALLBACK: Route Not Found
    // ---------------------------------------------------------
    default:
        http_response_code(400); // 400 Bad Request
        echo json_encode(['error' => 'Invalid API Route Requested.']);
        break;
}