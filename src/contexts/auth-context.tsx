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
  const [appUser, setAppUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('campus-connect-user');
      if (storedUser) {
        setAppUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('campus-connect-user');
    }
    setIsAuthLoading(false); 
  }, []);

  const login = useCallback((newUser: User) => {
    localStorage.setItem('campus-connect-user', JSON.stringify(newUser));
    setAppUser(newUser);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('campus-connect-user');
    setAppUser(null);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const isAuthPage = pathname === '/login';

    if (appUser) {
      if (isAuthPage) {
        router.replace('/dashboard');
      }
    } else {
      if (!isAuthPage) {
        router.replace('/login');
      }
    }
  }, [appUser, isAuthLoading, pathname, router]);

  const showLoading = isAuthLoading || (appUser && pathname === '/login') || (!appUser && pathname !== '/login');
  
  if (showLoading) {
    return <LoadingScreen />;
  }

  const contextValue: AuthContextType = { 
      user: appUser, 
      login, 
      logout, 
      isAuthLoading 
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
