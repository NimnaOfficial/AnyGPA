<?php
// db.php - The Secure XAMPP Database Connection
$host = 'localhost';
$port = '3307';         // Specify your custom XAMPP port here!
$db   = 'any_gpa_core';
$user = 'root';         // Default XAMPP username
$pass = '';             // Default XAMPP password is empty

try {
    // Notice how port=$port is now safely tucked inside the main string
    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8";
    
    // We only pass 3 arguments: DSN, User, Password
    $pdo = new PDO($dsn, $user, $pass);
    
    // Turn on strict error reporting
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(["error" => "Database Connection Failed: " . $e->getMessage()]));
}
?>