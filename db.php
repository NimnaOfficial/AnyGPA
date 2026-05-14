<?php
// db.php - Secure Production Database Connection

$host = 'localhost';
$port = '3307';         // 3306 is standard. Change to 3307 ONLY if XAMPP explicitly says 3307.
$db   = 'any_gpa_core';
$user = 'root';         
$pass = '';             

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); 
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); 
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); 
} catch (PDOException $e) {
    die(json_encode(["error" => "FATAL ERROR: Core Database Offline."]));
}
?>