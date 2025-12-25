import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'receptionist' | 'trainer';
  branchId?: string;  // ✅ Use camelCase
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_PERMISSIONS = {
  admin: ['*'], // Full access
  manager: ['students.read', 'students.write', 'fees.read', 'attendance.read', 'trainers.read', 'reports.read'],
  receptionist: ['students.write', 'fees.write', 'attendance.read'],
  trainer: ['attendance.write', 'students.read']
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // ✅ Ensure consistent user object shape
        if (userData && userData.id && userData.role) {
          setUser(userData);
        } else {
          console.warn('Invalid user data structure, clearing session');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
        }
      } catch (error) {
        console.error('Invalid stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    console.log("Auth: Starting login process for:", credentials.username);
    try {
      const { user: userData } = await api.login(credentials);
      console.log("Auth: Login API response:", userData);
      
      // ✅ Validate user data structure before setting
      if (!userData || !userData.id || !userData.role) {
        throw new Error('Invalid user data received from server');
      }
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userRole', userData.role);
      console.log("Auth: Login completed successfully", { userId: userData.id, role: userData.role, branchId: userData.branchId });
    } catch (error) {
      console.error("Auth: Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const canAccess = (resource: string): boolean => {
    if (!user) return false;
    
    switch (user.role) {
      case 'admin':
        return true;
      case 'manager':
        return ['dashboard', 'students', 'fees', 'attendance', 'trainers', 'reports'].includes(resource);
      case 'receptionist':
        return ['dashboard', 'students', 'fees'].includes(resource);
      case 'trainer':
        return ['dashboard', 'attendance', 'students'].includes(resource);
      default:
        return false;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      hasPermission,
      canAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}