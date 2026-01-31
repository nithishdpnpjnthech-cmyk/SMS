#!/bin/bash

# Test API endpoints
echo "Testing API endpoints..."

# Test programs endpoint
echo "Testing /api/programs..."
curl -s http://127.0.0.1:5051/api/programs | jq '.'

echo -e "\nTesting /api/batches..."
curl -s http://127.0.0.1:5051/api/batches | jq '.'

echo -e "\nTesting /api/branches..."
curl -s http://127.0.0.1:5051/api/branches | jq '.'

echo -e "\nTesting login endpoint..."
curl -s -X POST http://127.0.0.1:5051/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq '.'

echo -e "\nAPI tests completed."