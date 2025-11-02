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
  isLoading: boolean; // Combined loading state
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
  const [isAppUserLoading, setIsAppUserLoading] = useState(true);
  const { user: firebaseUser, isLoading: isFirebaseUserLoading } = useFirebaseUser();
  const router = useRouter();
  const pathname = usePathname();

  // Effect to load user from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('campus-connect-user');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setAppUser(parsedUser);
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('campus-connect-user');
    } finally {
      setIsAppUserLoading(false);
    }
  }, []);
  
  const isLoading = isAppUserLoading || isFirebaseUserLoading;

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

  // Effect for handling redirects
  useEffect(() => {
    if (isLoading) return; // Don't do anything until loading is complete

    const isAuthPage = pathname === '/login';

    if (!appUser && !isAuthPage) {
      // If no user and not on login page, redirect to login
      router.replace('/login');
    } else if (appUser && isAuthPage) {
      // If there IS a user and we are on the login page, redirect to dashboard
      router.replace('/dashboard');
    }
  }, [appUser, isLoading, pathname, router]);

  // If still loading, or if redirecting, show the loading screen.
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!appUser && pathname !== '/login') {
    return <LoadingScreen />;
  }

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
