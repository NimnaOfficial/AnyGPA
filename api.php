<?php
// api.php - The ANY GPA REST API
require 'db.php';
header('Content-Type: application/json'); // Tell the browser we are sending data, not HTML

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Route 1: Get all available public grading systems
if ($action === 'get_systems') {
    $stmt = $pdo->query("SELECT * FROM grading_systems WHERE is_public = 1");
    $systems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($systems);
    exit;
}

// Route 2: Get the specific A, B, C rules for a selected system
if ($action === 'get_rules') {
    $system_id = isset($_GET['id']) ? (int)$_GET['id'] : 1;
    
    // We order by point_value DESC so A+ (4.0) is always at the top of the dropdown
    $stmt = $pdo->prepare("SELECT grade_letter, point_value FROM grade_rules WHERE system_id = ? ORDER BY point_value DESC");
    $stmt->execute([$system_id]);
    $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($rules);
    exit;
}

// If JS asks for something that doesn't exist
echo json_encode(['error' => 'Invalid API Action']);
?>