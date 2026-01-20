#!/bin/bash

# Student Portal Deployment Script
# This script sets up the required database tables for the student portal

echo "🚀 Setting up Student Portal Database Tables..."

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client not found. Please install MySQL client."
    exit 1
fi

# Prompt for database credentials
read -p "Enter MySQL username: " DB_USER
read -s -p "Enter MySQL password: " DB_PASS
echo
read -p "Enter database name: " DB_NAME

echo "📊 Creating student portal tables..."

# Execute SQL commands
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'EOF'
-- Student Portal Credentials Table
CREATE TABLE IF NOT EXISTS student_portal_credentials (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36) NOT NULL,
  last_login TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_student_portal_username (username),
  INDEX idx_student_portal_student_id (student_id)
);

-- Student Uniforms Table
CREATE TABLE IF NOT EXISTS student_uniforms (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL,
  issued BOOLEAN DEFAULT FALSE,
  issue_date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_uniform (student_id)
);

-- Verify tables were created
SHOW TABLES LIKE 'student_%';
EOF

if [ $? -eq 0 ]; then
    echo "✅ Student portal tables created successfully!"
    echo "📋 Tables created:"
    echo "   - student_portal_credentials"
    echo "   - student_uniforms"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Restart your application server"
    echo "2. Login as Admin"
    echo "3. Go to any student profile"
    echo "4. Create student login credentials"
    echo "5. Share credentials with students"
    echo ""
    echo "🔗 Student portal will be available at: /student/login"
else
    echo "❌ Failed to create tables. Please check your database connection and permissions."
    exit 1
fi