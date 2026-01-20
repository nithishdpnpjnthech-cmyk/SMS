import { useStudentAuth } from '@/lib/student-auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import StudentLogin from './StudentLogin';

export default function StudentLoginPage() {
  const { login, isAuthenticated } = useStudentAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/student/dashboard');
    }
  }, [isAuthenticated, setLocation]);

  if (isAuthenticated) {
    return null;
  }

  return <StudentLogin onLogin={login} />;
}