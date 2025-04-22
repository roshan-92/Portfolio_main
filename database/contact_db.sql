-- Drop database if exists and create new one
DROP DATABASE IF EXISTS portfolio;
CREATE DATABASE portfolio;
USE portfolio;

-- Create contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create subscribers table for newsletter
CREATE TABLE IF NOT EXISTS subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'unsubscribed') DEFAULT 'active',
    CONSTRAINT valid_email CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create admin users table for managing messages
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    status ENUM('active', 'inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create message replies table
CREATE TABLE IF NOT EXISTS message_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    admin_id INT NOT NULL,
    reply_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES contact_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    project_url VARCHAR(255),
    github_url VARCHAR(255),
    technologies VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    display_order INT DEFAULT 0,
    INDEX idx_status_order (status, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('frontend', 'backend', 'database', 'devops', 'other') NOT NULL,
    proficiency_level INT CHECK (proficiency_level BETWEEN 1 AND 5),
    years_experience DECIMAL(3,1),
    display_order INT DEFAULT 0,
    INDEX idx_category_order (category, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drop and recreate the stored procedure
DROP PROCEDURE IF EXISTS InsertContactMessage;
DELIMITER //

CREATE PROCEDURE InsertContactMessage(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_subject VARCHAR(200),
    IN p_message TEXT,
    IN p_ip_address VARCHAR(45),
    IN p_user_agent VARCHAR(255)
)
BEGIN
    INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent)
    VALUES (p_name, p_email, p_subject, p_message, p_ip_address, p_user_agent);
END //

DELIMITER ;

-- Drop and recreate the view
DROP VIEW IF EXISTS unread_messages;
CREATE VIEW unread_messages AS
SELECT 
    id,
    name,
    email,
    subject,
    created_at
FROM contact_messages
WHERE status = 'unread'
ORDER BY created_at DESC;

-- Create default admin user (change password after first login)
INSERT INTO admin_users (username, password_hash, email, status) 
VALUES ('admin', '$2y$10$8K1p/a0dL1LXMIhuF7CpvOD0TDhqP8A.5uJ5Z9X3zj6TZsHJz1OPi', 'admin@example.com', 'active');

-- Grant permissions (modify password as needed)
DROP USER IF EXISTS 'portfolio_user'@'localhost';
CREATE USER 'portfolio_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON portfolio.* TO 'portfolio_user'@'localhost';
FLUSH PRIVILEGES;
