#!/usr/bin/env node

// Simple script to fix branch assignments for manager and reception users
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

async function fixBranchAssignments() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'KAMAKSHI@9dk',
      database: 'sms'
    });

    console.log('Connected to database');

    // Get current users
    const [users] = await connection.execute('SELECT id, username, role, branch_id FROM users');
    console.log('Current users:', users);

    // Get available branches
    const [branches] = await connection.execute('SELECT id, name FROM branches');
    console.log('Available branches:', branches);

    if (branches.length === 0) {
      console.log('No branches found. Creating default branches...');
      
      // Create default branches
      const branchesToCreate = [
        { name: 'Rammurthy Nagar', address: 'Rammurthy Nagar, Bangalore' },
        { name: 'Kasturi Nagar', address: 'Kasturi Nagar, Bangalore' },
        { name: 'Kalyan Nagar', address: 'Kalyan Nagar, Bangalore' }
      ];

      for (const branch of branchesToCreate) {
        const branchId = randomUUID();
        await connection.execute(
          'INSERT INTO branches (id, name, address, created_at) VALUES (?, ?, ?, NOW())',
          [branchId, branch.name, branch.address]
        );
        console.log(`Created branch: ${branch.name} (${branchId})`);
      }

      // Refresh branches list
      const [newBranches] = await connection.execute('SELECT id, name FROM branches');
      branches.splice(0, branches.length, ...newBranches);
    }

    // Create manager and reception users for each branch if they don't exist
    for (const branch of branches) {
      const branchName = branch.name.toLowerCase().replace(/\s+/g, '-');
      
      // Create manager if doesn't exist
      const [existingManager] = await connection.execute(
        'SELECT id FROM users WHERE role = ? AND branch_id = ?',
        ['manager', branch.id]
      );

      if (existingManager.length === 0) {
        const managerId = randomUUID();
        await connection.execute(
          'INSERT INTO users (id, username, password, role, email, name, branch_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
          [
            managerId,
            `manager-${branchName}`,
            'password123',
            'manager',
            `manager@${branchName}.com`,
            `${branch.name} Manager`,
            branch.id
          ]
        );
        console.log(`Created manager for ${branch.name}: manager-${branchName}`);
      }

      // Create reception if doesn't exist
      const [existingReception] = await connection.execute(
        'SELECT id FROM users WHERE role = ? AND branch_id = ?',
        ['reception', branch.id]
      );

      if (existingReception.length === 0) {
        const receptionId = randomUUID();
        await connection.execute(
          'INSERT INTO users (id, username, password, role, email, name, branch_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
          [
            receptionId,
            `reception-${branchName}`,
            'password123',
            'reception',
            `reception@${branchName}.com`,
            `${branch.name} Reception`,
            branch.id
          ]
        );
        console.log(`Created reception for ${branch.name}: reception-${branchName}`);
      }
    }

    // Update existing users without branch assignments
    const [unassignedUsers] = await connection.execute(
      'SELECT id, username, role FROM users WHERE role IN (?, ?) AND (branch_id IS NULL OR branch_id = "")',
      ['manager', 'reception']
    );

    for (const user of unassignedUsers) {
      // Assign to first available branch
      if (branches.length > 0) {
        await connection.execute(
          'UPDATE users SET branch_id = ? WHERE id = ?',
          [branches[0].id, user.id]
        );
        console.log(`Assigned ${user.username} (${user.role}) to ${branches[0].name}`);
      }
    }

    // Show final results
    const [finalUsers] = await connection.execute(`
      SELECT u.id, u.username, u.role, u.branch_id, b.name as branch_name 
      FROM users u 
      LEFT JOIN branches b ON u.branch_id = b.id 
      ORDER BY u.role, u.username
    `);

    console.log('\nFinal user assignments:');
    console.table(finalUsers);

    console.log('\n✅ Branch assignments fixed successfully!');
    console.log('\nTest credentials:');
    for (const branch of branches) {
      const branchName = branch.name.toLowerCase().replace(/\s+/g, '-');
      console.log(`Manager: manager-${branchName} / password123`);
      console.log(`Reception: reception-${branchName} / password123`);
    }

  } catch (error) {
    console.error('Error fixing branch assignments:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
fixBranchAssignments();