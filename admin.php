<?php
session_start();
$master_password = "NIMA_CORE_2026"; // YOUR SECRET PASSWORD

// Handle Login
if (isset($_POST['login'])) {
    if ($_POST['password'] === $master_password) {
        $_SESSION['admin_logged_in'] = true;
    } else {
        $error = "ACCESS DENIED.";
    }
}

// Handle Logout
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: admin.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ANY GPA | Core Admin Panel</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css"> <style>
        .admin-login { max-width: 400px; margin: 100px auto; text-align: center; }
        .admin-table { width: 100%; border-collapse: collapse; margin-top: 2rem; background: var(--surface); border-radius: var(--radius); overflow: hidden; }
        .admin-table th, .admin-table td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border); }
        .admin-table th { background: rgba(255,215,0,0.1); color: var(--brand-main); text-transform: uppercase; letter-spacing: 1px; }
        .delete-btn { background: rgba(255, 68, 68, 0.1); color: var(--danger); border: 1px solid var(--danger); padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; transition: 0.3s; font-weight: bold; }
        .delete-btn:hover { background: var(--danger); color: #fff; }
    </style>
</head>
<body>
    <div class="cyber-grid"></div>

    <?php if (!isset($_SESSION['admin_logged_in'])): ?>
        <main class="admin-login glass-panel" style="padding: 3rem;">
            <h1 style="font-size: 2rem; color: var(--danger); margin-bottom: 1rem;">RESTRICTED AREA</h1>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">Enter Master Password</p>
            
            <?php if(isset($error)) echo "<p style='color: var(--danger); font-weight: bold; margin-bottom: 1rem;'>$error</p>"; ?>
            
            <form method="POST">
                <input type="password" name="password" class="modal-input" placeholder="Password..." required style="text-align: center; letter-spacing: 5px;">
                <button type="submit" name="login" class="cyber-btn-solid" style="background: var(--danger); color: white;">AUTHORIZE</button>
            </form>
        </main>
    <?php else: ?>
        <main id="app-container" style="margin-top: 20px;">
            <header class="sys-header" style="flex-direction: row;">
                <div>
                    <div class="sys-badge" style="background: rgba(255,68,68,0.2); border-color: var(--danger); color: var(--danger);">GOD MODE ENABLED</div>
                    <h1 style="font-size: 3rem;">Database Control</h1>
                </div>
                <a href="?logout=1" class="cyber-btn-outline" style="border-color: var(--danger); color: var(--danger);">Terminate Session</a>
            </header>

            <div class="glass-panel" style="padding: 2rem;">
                <h3>Global Active Frameworks</h3>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>University / System Name</th>
                            <th>Country</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="admin-table-body">
                        </tbody>
                </table>
            </div>
        </main>

        <script>
            // Admin JS Engine
            const apiBase = "http://localhost:3307/GpaCal/nima-core-calculator/src/api.php"; // Check your port!
            const masterPass = "NIMA_CORE_2026"; // Needs to match for API calls

            async function loadDatabase() {
                const res = await fetch(`${apiBase}?action=get_systems`);
                const systems = await res.json();
                const tbody = document.getElementById("admin-table-body");
                tbody.innerHTML = "";
                
                systems.forEach(sys => {
                    tbody.innerHTML += `
                        <tr>
                            <td>#${sys.system_id}</td>
                            <td style="font-weight: bold; color: white;">${sys.system_name}</td>
                            <td style="color: var(--text-muted);">${sys.country}</td>
                            <td><button class="delete-btn" onclick="purgeSystem(${sys.system_id})">PURGE</button></td>
                        </tr>
                    `;
                });
            }

            async function purgeSystem(id) {
                if(!confirm("WARNING: This will permanently delete this university and break any calculators currently using it. Proceed?")) return;
                
                const response = await fetch(`${apiBase}?action=delete_system`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id, admin_pass: masterPass })
                });
                
                const data = await response.json();
                if(data.success) {
                    alert("System Purged Successfully.");
                    loadDatabase(); // Reload table
                } else {
                    alert("Error: " + data.error);
                }
            }

            loadDatabase();
        </script>
    <?php endif; ?>
</body>
</html>