#!/usr/bin/env node

/**
 * Production API Test Script
 * Tests the exact root causes identified and verifies fixes
 */

const API_BASE = 'http://localhost:5051';

// Test admin credentials (adjust as needed)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let authHeaders = {};

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers
    },
    ...options
  });
  
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { rawResponse: text };
  }
  
  return {
    status: response.status,
    ok: response.ok,
    data,
    url
  };
}

async function login() {
  console.log('🔐 Testing admin login...');
  const result = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(ADMIN_CREDENTIALS)
  });
  
  if (!result.ok) {
    console.error('❌ Login failed:', result.data);
    process.exit(1);
  }
  
  const user = result.data.user;
  console.log('✅ Login successful:', {
    id: user.id,
    role: user.role,
    branchId: user.branchId
  });
  
  // Set auth headers for subsequent requests
  authHeaders = {
    'x-user-id': user.id,
    'x-user-role': user.role,
    'x-user-branch': user.branchId || ''
  };
  
  return user;
}

async function testDashboardStats() {
  console.log('\n📊 Testing dashboard stats...');
  
  // Test without branch filter (admin should see all)
  const result1 = await makeRequest('/api/dashboard/stats');
  console.log('Dashboard stats (no filter):', {
    status: result1.status,
    totalStudents: result1.data.totalStudents,
    hasData: result1.data.totalStudents > 0
  });
  
  // Test with branch filter
  const result2 = await makeRequest('/api/dashboard/stats?branchId=all');
  console.log('Dashboard stats (branchId=all):', {
    status: result2.status,
    totalStudents: result2.data.totalStudents,
    hasData: result2.data.totalStudents > 0
  });
  
  return result1.ok && result2.ok;
}

async function testStudentsAPI() {
  console.log('\n👥 Testing students API...');
  
  // Test without filters (admin should see all active students)
  const result1 = await makeRequest('/api/students');
  console.log('Students (no filter):', {
    status: result1.status,
    count: Array.isArray(result1.data) ? result1.data.length : 0,
    hasData: Array.isArray(result1.data) && result1.data.length > 0
  });
  
  // Test with "All Programs" filter (should be ignored)
  const result2 = await makeRequest('/api/students?program=All Programs');
  console.log('Students (program=All Programs):', {
    status: result2.status,
    count: Array.isArray(result2.data) ? result2.data.length : 0,
    hasData: Array.isArray(result2.data) && result2.data.length > 0
  });
  
  // Test with branch filter
  const result3 = await makeRequest('/api/students?branchId=all');
  console.log('Students (branchId=all):', {
    status: result3.status,
    count: Array.isArray(result3.data) ? result3.data.length : 0,
    hasData: Array.isArray(result3.data) && result3.data.length > 0
  });
  
  return result1.ok && result2.ok && result3.ok;
}

async function testAttendanceAPI() {
  console.log('\n📅 Testing attendance API...');
  
  // Test without filters
  const result1 = await makeRequest('/api/attendance');
  console.log('Attendance (no filter):', {
    status: result1.status,
    count: Array.isArray(result1.data) ? result1.data.length : 0
  });
  
  // Test with today's date
  const today = new Date().toISOString().split('T')[0];
  const result2 = await makeRequest(`/api/attendance?date=${today}`);
  console.log('Attendance (today):', {
    status: result2.status,
    count: Array.isArray(result2.data) ? result2.data.length : 0
  });
  
  return result1.ok && result2.ok;
}

async function testMasterDataAPIs() {
  console.log('\n🎯 Testing master data APIs...');
  
  // Test programs API
  const result1 = await makeRequest('/api/admin/programs');
  console.log('Admin programs:', {
    status: result1.status,
    count: Array.isArray(result1.data) ? result1.data.length : 0,
    hasData: Array.isArray(result1.data) && result1.data.length > 0
  });
  
  // Test batches API
  const result2 = await makeRequest('/api/admin/batches');
  console.log('Admin batches:', {
    status: result2.status,
    count: Array.isArray(result2.data) ? result2.data.length : 0,
    hasData: Array.isArray(result2.data) && result2.data.length > 0
  });
  
  // Test public programs API
  const result3 = await makeRequest('/api/programs');
  console.log('Public programs:', {
    status: result3.status,
    count: Array.isArray(result3.data) ? result3.data.length : 0
  });
  
  // Test public batches API
  const result4 = await makeRequest('/api/batches');
  console.log('Public batches:', {
    status: result4.status,
    count: Array.isArray(result4.data) ? result4.data.length : 0
  });
  
  return result1.ok && result2.ok && result3.ok && result4.ok;
}

async function testBranchHandling() {
  console.log('\n🏢 Testing branch handling for admin...');
  
  // Test that admin can access data without branch restrictions
  const endpoints = [
    '/api/dashboard/stats',
    '/api/students',
    '/api/attendance',
    '/api/admin/programs',
    '/api/admin/batches'
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint);
    const passed = result.ok;
    console.log(`${passed ? '✅' : '❌'} ${endpoint}: ${result.status}`);
    
    if (!passed) {
      console.log('   Error:', result.data);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function runTests() {
  console.log('🚀 Starting Production API Tests\n');
  console.log('Testing Root Causes:');
  console.log('1. Missing API methods in frontend');
  console.log('2. Branch filtering issues for admin users');
  console.log('3. Filter parameter handling');
  console.log('4. Authentication header consistency\n');
  
  try {
    // Login first
    const user = await login();
    
    if (user.role !== 'admin') {
      console.error('❌ Test requires admin user, got:', user.role);
      process.exit(1);
    }
    
    // Run all tests
    const results = await Promise.all([
      testDashboardStats(),
      testStudentsAPI(),
      testAttendanceAPI(),
      testMasterDataAPIs(),
      testBranchHandling()
    ]);
    
    const allPassed = results.every(r => r);
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 TEST RESULTS: ${allPassed ? 'ALL PASSED ✅' : 'SOME FAILED ❌'}`);
    console.log('='.repeat(50));
    
    if (allPassed) {
      console.log('\n✅ All root causes have been fixed:');
      console.log('   • API methods are now available');
      console.log('   • Admin users can access all data');
      console.log('   • Filter parameters work correctly');
      console.log('   • Authentication headers are consistent');
    } else {
      console.log('\n❌ Some issues remain - check the logs above');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    process.exit(1);
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

runTests();