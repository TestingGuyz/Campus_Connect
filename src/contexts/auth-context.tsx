'use client';

import { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/icons';

export type UserRole = 'admin' | 'student' | 'teacher';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  className?: string;
  sectionName?: string;
};

// This mirrors the structure of custom claims we would set on the backend.
export type AuthClaims = {
  role?: UserRole;
};

export type AuthContextType = {
  user: User | null;
  claims: AuthClaims | null;
  login: (user: User, claims: AuthClaims) => void;
  logout: () => void;
  isAuthLoading: boolean; 
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function LoadingScreen() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) {
                    clearInterval(timer);
                    return 95;
                }
                return prev + Math.random() * 20;
            });
        }, 200);

        return () => clearInterval(timer);
    }, []);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <div className="mb-8 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50">
            <Icons.logo className="h-24 w-24 text-primary" />
          </div>
          <div className="w-full max-w-xs">
            <Progress value={progress} className="h-2" />
          </div>
          <p className="mt-4 text-muted-foreground">Connecting to CampusConnect...</p>
      </div>
    );
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<AuthClaims | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    const checkUser = () => {
      try {
        const storedUser = localStorage.getItem('campus-connect-user');
        const storedClaims = localStorage.getItem('campus-connect-claims');
        if (isMounted) {
          if (storedUser && storedClaims) {
            setUser(JSON.parse(storedUser));
            setClaims(JSON.parse(storedClaims));
          }
        }
      } catch (error) {
        console.error('Failed to parse auth data from localStorage', error);
        localStorage.removeItem('campus-connect-user');
        localStorage.removeItem('campus-connect-claims');
      } finally {
        if (isMounted) {
          // Artificial delay for mock environment
          setTimeout(() => setIsAuthLoading(false), 500);
        }
      }
    };
    
    checkUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((newUser: User, newClaims: AuthClaims) => {
    localStorage.setItem('campus-connect-user', JSON.stringify(newUser));
    localStorage.setItem('campus-connect-claims', JSON.stringify(newClaims));
    setUser(newUser);
    setClaims(newClaims);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('campus-connect-user');
    localStorage.removeItem('campus-connect-claims');
    setUser(null);
    setClaims(null);
    router.push('/login');
  }, [router]);
  
  useEffect(() => {
    if (!isAuthLoading) {
      const isAuthPage = pathname === '/login';
      if (!user && !isAuthPage) {
        router.replace('/login');
      }
      if (user && isAuthPage) {
        router.replace('/dashboard');
      }
    }
  }, [user, isAuthLoading, pathname, router]);

  const contextValue: AuthContextType = { 
      user, 
      claims,
      login, 
      logout, 
      isAuthLoading 
  };
  
  if (isAuthLoading) {
      return <LoadingScreen />;
  }
  
  // This prevents flashing the login page while redirecting.
  const isAuthPage = pathname === '/login';
  if ((!user && !isAuthPage) || (user && isAuthPage)) {
      return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
