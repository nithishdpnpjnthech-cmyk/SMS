import { storage } from './server/storage';

async function fixTrainerLink() {
  try {
    console.log('🔍 Checking trainer-user links...\n');
    
    // Check current status
    const check = await storage.query(`
      SELECT 
        u.id as user_id, 
        u.username,
        t.id as trainer_id,
        t.name as trainer_name,
        t.user_id as current_link
      FROM users u
      LEFT JOIN trainers t ON t.user_id = u.id
      WHERE u.role = 'trainer'
    `);
    
    console.log('Current trainer-user links:');
    console.table(check);
    
    // Find unlinked trainers
    const unlinked = check.filter((row: any) => !row.current_link && row.trainer_id);
    
    if (unlinked.length === 0) {
      console.log('\n✅ All trainers are properly linked!');
      process.exit(0);
    }
    
    console.log(`\n⚠️  Found ${unlinked.length} unlinked trainer(s)\n`);
    
    // Fix each unlinked trainer
    for (const row of unlinked) {
      console.log(`Linking trainer "${row.trainer_name}" to user "${row.username}"...`);
      
      await storage.query(
        'UPDATE trainers SET user_id = ? WHERE id = ?',
        [row.user_id, row.trainer_id]
      );
      
      console.log('✅ Linked successfully!');
    }
    
    // Verify
    console.log('\n🔍 Verifying links...\n');
    const verify = await storage.query(`
      SELECT 
        u.id as user_id, 
        u.username,
        t.id as trainer_id,
        t.name as trainer_name,
        t.user_id as current_link
      FROM users u
      JOIN trainers t ON t.user_id = u.id
      WHERE u.role = 'trainer'
    `);
    
    console.log('Updated trainer-user links:');
    console.table(verify);
    
    console.log('\n✅ All done! Refresh your browser now.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixTrainerLink();
