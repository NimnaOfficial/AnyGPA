<?php
// =====================================================================
// ANY GPA CORE: ENTERPRISE REST API
// =====================================================================

require 'db.php';
require_once 'config.php';

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
// Safely extract action to prevent "Undefined array key" PHP warnings
$action = isset($_GET['action']) ? filter_var(trim($_GET['action']), FILTER_SANITIZE_STRING) : '';
// Decode the payload ONCE for the entire application to save server memory
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// --- 3. HIGH-PERFORMANCE ROUTER ---
switch ($action) {

    // ---------------------------------------------------------
    // ROUTE: AI Marksheet Scanner (Gemini 1.5 Flash)
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    // ROUTE: AI Marksheet Scanner (With 5-Key Failover Rotation)
    // ---------------------------------------------------------
    case 'ai_scan_marksheet':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed.']);
            exit;
        }

        $mimeType = isset($input['mimeType']) ? $input['mimeType'] : 'application/pdf';
        $base64Image = $input['image'] ?? '';

        if (empty($base64Image)) {
            http_response_code(400);
            echo json_encode(['error' => 'No image or document data received.']);
            exit;
        }

        $base64Clean = preg_replace('/^data:.*?;base64,/', '', $base64Image);
        
        // --- OPTIMIZED AI PROMPT (IGNORES CREDITS/POINTS) ---
        $payload = [
            "contents" => [[
                "parts" => [
                    ["text" => "You are an elite academic data extraction engine. Analyze this transcript and extract the core grading data into a STRICT JSON array. 

UNIVERSAL HEURISTICS:
1. COURSE IDENTIFICATION: Extract the semantic name of the subject. Omit alphanumeric module codes and semester tags.
2. FINAL GRADE ISOLATION: Locate the FINAL outcome grade. Actively IGNORE intermediate columns like 'Midterm' or 'Coursework' and IGNORE 'Points' or 'Credits' columns.

STRICT CONSTRAINTS:
- Do NOT perform math or GPA calculations.
- Output ONLY a valid JSON array of objects using exactly these keys: 'course', 'grade'.
- Do NOT return markdown code blocks (```json). Return raw array."],
                    ["inline_data" => ["mime_type" => $mimeType, "data" => $base64Clean]]
                ]
            ]],
            "generationConfig" => ["response_mime_type" => "application/json"]
        ];

        $payloadJson = json_encode($payload);
        $successData = null;
        $lastErrorMessage = "All API keys failed.";

        // =========================================================
        // 🔄 THE FAILOVER ENGINE: Loops through all 5 keys
        // =========================================================
        foreach (GEMINI_API_KEYS as $index => $apiKey) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payloadJson);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($response !== false) {
                $aiData = json_decode($response, true);
                
                // If the request was successful (HTTP 200) AND we have no Google errors
                if ($httpCode == 200 && !isset($aiData['error'])) {
                    $successData = $aiData;
                    break; // EXIT THE LOOP! We found a working key.
                } else {
                    // It failed (Quota limit, bad key, etc.). Save the error and let the loop try the next key.
                    $lastErrorMessage = isset($aiData['error']) ? $aiData['error']['message'] : "HTTP Error $httpCode on Key " . ($index + 1);
                    continue; 
                }
            }
        }
        // =========================================================

        // After the loop finishes, check if we ever got a successful response
        if ($successData && isset($successData['candidates'][0]['content']['parts'][0]['text'])) {
            http_response_code(200);
            echo trim($successData['candidates'][0]['content']['parts'][0]['text']);
        } else {
            // If the loop finished and ALL 5 keys failed
            http_response_code(500);
            echo json_encode(["error" => "System Overload. All backup APIs failed. Last Error: " . $lastErrorMessage]);
        }
        break;

    // ---------------------------------------------------------
    // ROUTE: Fetch Global Public Systems
    // ---------------------------------------------------------
   case 'get_systems':
        try {
            // Added pass_mark to the SELECT statement
            $stmt = $pdo->query("SELECT system_id, system_name, country, pass_mark FROM grading_systems WHERE is_public = 1 ORDER BY system_id ASC");
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

    // --- ROUTE: Deploy Custom Strategy ---
    case 'create_system':
        $sysName = trim($input['system_name'] ?? '');
        $sysCountry = trim($input['country'] ?? '');
        $passMark = floatval($input['pass_mark'] ?? 0); // New Pass Mark Variable
        $customRules = $input['custom_rules'] ?? []; 
        
        // Validation now requires the pass mark
        if (empty($sysName) || empty($sysCountry) || empty($customRules) || $passMark <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Incomplete data. Pass mark is mandatory.']);
            exit;
        }

        try {
            $pdo->beginTransaction(); 
            // Insert the pass mark into the database
            $stmt = $pdo->prepare("INSERT INTO grading_systems (system_name, country, pass_mark, is_public) VALUES (?, ?, ?, 1)");
            $stmt->execute([$sysName, $sysCountry, $passMark]);
            $newId = $pdo->lastInsertId();
            
            $ruleStmt = $pdo->prepare("INSERT INTO grade_rules (system_id, grade_letter, point_value) VALUES (?, ?, ?)");
            foreach ($customRules as $rule) {
                $ruleStmt->execute([$newId, trim($rule['grade_letter']), floatval($rule['point_value'])]);
            }
            $pdo->commit(); 
            echo json_encode(['success' => true, 'message' => 'Deployed Globally!', 'id' => $newId]);
        } catch(PDOException $e) {
            $pdo->rollBack(); 
            http_response_code(500);
            echo json_encode(['error' => 'Deployment Failed: ' . $e->getMessage()]);
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

        if ($user === '0000' && $pass === '0000') {
            http_response_code(200);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(401); 
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

        if ($user !== '0000' || $pass !== '0000') {
            http_response_code(403); 
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
        http_response_code(400); 
        echo json_encode(['error' => 'Invalid API Route Requested.']);
        break;
}
?>