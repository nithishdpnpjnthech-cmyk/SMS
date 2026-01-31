#!/bin/bash

# Quick test for fees dashboard NaN fix
echo "Testing fees dashboard API on port 5050..."

# Test the fees dashboard endpoint
curl -s "http://localhost:5050/api/fees/dashboard" \
  -H "x-user-role: admin" \
  -H "x-user-id: test-admin" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "Expected: All values should be numbers (0 or actual amounts), NOT NaN"