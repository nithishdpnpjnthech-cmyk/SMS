import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  requiredRole?: string;
  allowedRoles?: string[];
  path?: string;
}

export default function ProtectedRoute({ 
  component: Component, 
  requiredRole, 
  allowedRoles,
  ...props 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate dashboard based on role
      switch (user?.role) {
        case 'admin':
          setLocation('/dashboard');
          break;
        case 'manager':
          setLocation('/dashboard/manager');
          break;
        case 'receptionist':
          setLocation('/dashboard/receptionist');
          break;
        case 'trainer':
          setLocation('/dashboard/trainer');
          break;
        default:
          setLocation('/');
      }
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard
      switch (user.role) {
        case 'admin':
          setLocation('/dashboard');
          break;
        case 'manager':
          setLocation('/dashboard/manager');
          break;
        case 'receptionist':
          setLocation('/dashboard/receptionist');
          break;
        case 'trainer':
          setLocation('/dashboard/trainer');
          break;
        default:
          setLocation('/');
      }
      return;
    }
  }, [isAuthenticated, user, requiredRole, allowedRoles, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <Component {...props} />;
}