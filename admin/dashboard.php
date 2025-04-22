<?php
session_start();
require_once '../php/db_config.php';

// Check if logged in
if (!isset($_SESSION['admin_id'])) {
    header('Location: index.php');
    exit;
}

$conn = getDBConnection();
$messages = [];
$error = '';

if ($conn) {
    try {
        $stmt = $conn->query("
            SELECT 
                cm.*,
                COALESCE(mr.reply_count, 0) as reply_count
            FROM contact_messages cm
            LEFT JOIN (
                SELECT message_id, COUNT(*) as reply_count
                FROM message_replies
                GROUP BY message_id
            ) mr ON cm.id = mr.message_id
            ORDER BY cm.created_at DESC
        ");
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        $error = 'Error loading messages';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Portfolio</title>
    <link rel="stylesheet" href="../style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .admin-dashboard {
            padding: 2rem;
            background: var(--bg-color);
            min-height: 100vh;
        }
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }
        .messages-table {
            width: 100%;
            border-collapse: collapse;
            background: var(--card-bg);
            border-radius: 8px;
            overflow: hidden;
        }
        .messages-table th,
        .messages-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }
        .messages-table th {
            background: var(--primary-color);
            color: white;
        }
        .message-status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.875rem;
        }
        .status-unread { background: #dc3545; color: white; }
        .status-read { background: #ffc107; }
        .status-replied { background: #28a745; color: white; }
        .actions button {
            padding: 0.25rem 0.5rem;
            margin: 0 0.25rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .view-btn { background: var(--primary-color); color: white; }
        .delete-btn { background: #dc3545; color: white; }
    </style>
</head>
<body>
    <div class="admin-dashboard">
        <div class="dashboard-header">
            <h1>Messages Dashboard</h1>
            <div>
                <span>Welcome, <?php echo htmlspecialchars($_SESSION['admin_username']); ?></span>
                <a href="logout.php" class="btn secondary">Logout</a>
            </div>
        </div>

        <?php if ($error): ?>
            <div class="error-message"><?php echo $error; ?></div>
        <?php endif; ?>

        <table class="messages-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Replies</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($messages as $message): ?>
                    <tr>
                        <td><?php echo date('Y-m-d H:i', strtotime($message['created_at'])); ?></td>
                        <td><?php echo htmlspecialchars($message['name']); ?></td>
                        <td><?php echo htmlspecialchars($message['email']); ?></td>
                        <td><?php echo htmlspecialchars($message['subject']); ?></td>
                        <td>
                            <span class="message-status status-<?php echo $message['status']; ?>">
                                <?php echo ucfirst($message['status']); ?>
                            </span>
                        </td>
                        <td><?php echo $message['reply_count']; ?></td>
                        <td class="actions">
                            <button class="view-btn" onclick="viewMessage(<?php echo $message['id']; ?>)">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="delete-btn" onclick="deleteMessage(<?php echo $message['id']; ?>)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <script>
        function viewMessage(id) {
            window.location.href = `view_message.php?id=${id}`;
        }

        function deleteMessage(id) {
            if (confirm('Are you sure you want to delete this message?')) {
                fetch(`delete_message.php?id=${id}`, { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            location.reload();
                        } else {
                            alert(data.message || 'Error deleting message');
                        }
                    });
            }
        }
    </script>
</body>
</html> 