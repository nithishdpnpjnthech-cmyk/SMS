#!/bin/bash

# Test script for bulk attendance functionality
echo "=== BULK ATTENDANCE TEST SCRIPT ==="

# 1. Apply database schema fixes
echo "1. Applying database schema fixes..."
mysql -u root -p sms < fix-attendance-schema.sql

# 2. Test API endpoint directly
echo "2. Testing bulk attendance API endpoint..."

# Create test payload
cat > test_bulk_attendance.json << 'EOF'
{
  "attendanceRecords": [
    {
      "studentId": "test-student-1",
      "date": "2024-01-15",
      "status": "present",
      "checkIn": "2024-01-15T09:00:00.000Z",
      "notes": "Test attendance",
      "batch": "Morning Batch"
    },
    {
      "studentId": "test-student-2", 
      "date": "2024-01-15",
      "status": "absent",
      "notes": "Test attendance",
      "batch": "Morning Batch"
    }
  ]
}
EOF

# Test with curl (server must be running)
echo "Testing API endpoint (make sure server is running on port 5050)..."
curl -X POST http://localhost:5050/api/attendance/bulk \
  -H "Content-Type: application/json" \
  -d @test_bulk_attendance.json \
  -v

echo ""
echo "=== TEST COMPLETE ==="
echo "Check server logs for detailed debugging information"
echo "If successful, you should see attendance records created/updated"

# Cleanup
rm -f test_bulk_attendance.json