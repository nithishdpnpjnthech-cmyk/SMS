// Frontend search function
const searchStudents = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    const params = new URLSearchParams({
      q: query,
      limit: '10'
    });
    
    const response = await fetch(`/api/students/search?${params}`, {
      headers: {
        'x-user-id': localStorage.getItem('userId'),
        'x-user-role': localStorage.getItem('userRole'),
        'x-user-branch': localStorage.getItem('userBranch'),
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};

// Usage with debounce
const [searchQuery, setSearchQuery] = useState('');
const [students, setStudents] = useState([]);

useEffect(() => {
  const timeoutId = setTimeout(async () => {
    const results = await searchStudents(searchQuery);
    setStudents(results);
  }, 300);
  
  return () => clearTimeout(timeoutId);
}, [searchQuery]);