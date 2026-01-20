import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  branchId: string;
  branchName: string;
  role: 'student';
}

interface StudentAuthContextType {
  student: Student | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing student session
    const storedStudent = localStorage.getItem('student');
    const storedToken = localStorage.getItem('studentToken');
    
    if (storedStudent && storedToken) {
      try {
        const studentData = JSON.parse(storedStudent);
        if (studentData && studentData.id && studentData.role === 'student') {
          setStudent(studentData);
        } else {
          // Clear invalid data
          localStorage.removeItem('student');
          localStorage.removeItem('studentToken');
        }
      } catch (error) {
        console.error('Invalid stored student data:', error);
        localStorage.removeItem('student');
        localStorage.removeItem('studentToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await fetch('/api/student/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const { student: studentData, token } = await response.json();
      
      if (!studentData || !studentData.id || studentData.role !== 'student' || !token) {
        throw new Error('Invalid student data received');
      }
      
      // Clear any existing student data first
      localStorage.removeItem('student');
      localStorage.removeItem('studentToken');
      
      // Set new student data
      setStudent(studentData);
      localStorage.setItem('student', JSON.stringify(studentData));
      localStorage.setItem('studentToken', token);
    } catch (error) {
      console.error('Student login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear all student-related data
    setStudent(null);
    localStorage.removeItem('student');
    localStorage.removeItem('studentToken');
    
    // Clear any cached API data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('student_') || key.includes('cache'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    window.location.href = '/student/login';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <StudentAuthContext.Provider value={{
      student,
      login,
      logout,
      isAuthenticated: !!student,
    }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);
  if (context === undefined) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
}