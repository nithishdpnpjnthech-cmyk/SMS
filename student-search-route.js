// Optimized student search route
app.get('/api/students/search', requireAuth(), async (req, res) => {
  try {
    const { q, limit = 10, branch_id } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const searchTerm = `%${q}%`;
    let query = `
      SELECT 
        s.id,
        s.name,
        s.phone,
        s.email,
        s.program,
        s.batch,
        s.branch_id,
        b.name as branch_name
      FROM students s
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE s.status = 'active'
        AND (
          s.name LIKE ? OR 
          s.phone LIKE ? OR 
          s.email LIKE ?
        )
    `;
    
    const params = [searchTerm, searchTerm, searchTerm];
    
    // Branch filtering
    if (branch_id) {
      query += ' AND s.branch_id = ?';
      params.push(branch_id);
    } else if (req.user.role !== 'admin' && req.user.branchId) {
      query += ' AND s.branch_id = ?';
      params.push(req.user.branchId);
    }
    
    query += ' ORDER BY s.name ASC LIMIT ?';
    params.push(parseInt(limit));
    
    const students = await storage.query(query, params);
    res.json(students);
    
  } catch (error) {
    console.error('Student search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});