'use client';

import { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { useFirebaseUser } from '@/firebase/provider';

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
  firebaseUser: import('firebase/auth').User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
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
            <Image 
                src="https://www.mpbfoundationhsschool.com/images/logo.png" 
                alt="M.P. Birla Foundation H.S. School Logo"
                width={150}
                height={150}
                unoptimized
                priority
            />
          </div>
          <div className="w-full max-w-xs">
            <Progress value={progress} className="h-2" />
          </div>
      </div>
    );
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [appUser, setAppUser] = useState<User | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const { user: firebaseUser, isLoading: isAuthLoading } = useFirebaseUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('campus-connect-user');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser?.id && parsedUser?.role) {
          setAppUser(parsedUser);
        } else {
          localStorage.removeItem('campus-connect-user');
        }
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('campus-connect-user');
    } finally {
      setIsAppLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('campus-connect-user');
    setAppUser(null);
    if (pathname !== '/login') {
      router.push('/login');
    }
  }, [router, pathname]);

  const login = useCallback((newUser: User) => {
    localStorage.setItem('campus-connect-user', JSON.stringify(newUser));
    setAppUser(newUser);
    router.push('/dashboard');
  }, [router]);
  
  const isLoading = isAppLoading || isAuthLoading;

  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = pathname === '/login';

    if (!appUser && !isAuthPage) {
      router.replace('/login');
    }
    
    if (appUser && isAuthPage) {
        router.replace('/dashboard');
    }

  }, [appUser, isLoading, pathname, router]);

  // This prevents rendering children on non-auth pages before auth state is resolved.
  if (isLoading && pathname !== '/login') {
    return <LoadingScreen />;
  }

  // Prevents flicker on the login page
  if (isLoading && pathname === '/login') {
    return <LoadingScreen />;
  }
  
  // If we have a user but are on the login page, don't render children to avoid flicker before redirect
  if (appUser && pathname === '/login') {
    return <LoadingScreen />;
  }

  const contextValue = { user: appUser, firebaseUser, login, logout, isLoading };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
