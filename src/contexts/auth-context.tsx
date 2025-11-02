'use client';

import { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/icons';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'teacher';
  className?: string;
  sectionName?: string;
};

export type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('campus-connect-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('campus-connect-user');
    }
    // Artificial delay to ensure all services are ready in a mock environment
    setTimeout(() => {
      setIsAuthLoading(false); 
    }, 500);
  }, []);

  const login = useCallback((newUser: User) => {
    setIsAuthLoading(true);
    localStorage.setItem('campus-connect-user', JSON.stringify(newUser));
    setUser(newUser);
    router.push('/dashboard');
    // Ensure loading state is false after login completes
    setTimeout(() => setIsAuthLoading(false), 100);
  }, [router]);

  const logout = useCallback(() => {
    setIsAuthLoading(true);
    localStorage.removeItem('campus-connect-user');
    setUser(null);
    router.push('/login');
     // Ensure loading state is false after logout completes
    setTimeout(() => setIsAuthLoading(false), 100);
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
      login, 
      logout, 
      isAuthLoading 
  };
  
  // Render a loading screen while auth state is being determined,
  // or if we are in a redirect state.
  if (isAuthLoading || (!user && pathname !== '/login') || (user && pathname === '/login')) {
      return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
