import { useStudentAuth } from '@/lib/student-auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface StudentProtectedRouteProps {
  component: React.ComponentType<any>;
  path?: string;
}

export default function StudentProtectedRoute({
  component: Component,
  ...props
}: StudentProtectedRouteProps) {
  const { student, isAuthenticated } = useStudentAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/student/login');
      return;
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return <Component {...props} />;
}