-- Essential indexes for student search performance

-- Composite index for search + status + branch filtering
CREATE INDEX idx_students_search_active ON students (status, branch_id, name);

-- Individual search field indexes
CREATE INDEX idx_students_name ON students (name);
CREATE INDEX idx_students_phone ON students (phone);
CREATE INDEX idx_students_email ON students (email);

-- Branch filtering index
CREATE INDEX idx_students_branch_status ON students (branch_id, status);

-- Full-text search index (optional for advanced search)
CREATE FULLTEXT INDEX idx_students_fulltext ON students (name, email, phone);

-- Verify indexes
SHOW INDEX FROM students;