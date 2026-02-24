/**
 * Script to drop trainer_attendance table
 * Run with: npx tsx drop-trainer-attendance-table.ts
 */

import { storage } from './server/storage';

async function dropTrainerAttendanceTable() {
  try {
    console.log('Dropping trainer_attendance table...');
    
    await storage.query('DROP TABLE IF EXISTS trainer_attendance');
    
    console.log('✅ Successfully dropped trainer_attendance table');
    console.log('All trainer clock-in/clock-out data has been removed.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error dropping table:', error);
    process.exit(1);
  }
}

dropTrainerAttendanceTable();
