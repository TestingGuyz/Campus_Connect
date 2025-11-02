'use client';

import { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { useFirebaseUser } from '@/firebase/provider';
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
  firebaseUser: import('firebase/auth').User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean; // True if we are still waiting for initial auth state
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
  const { user: firebaseUser, isLoading: isFirebaseUserLoading } = useFirebaseUser();
  const router = useRouter();
  const pathname = usePathname();

  // Load app user from localStorage on initial mount
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

  // Main effect for handling authentication state and redirects
  useEffect(() => {
    // Don't do anything until Firebase has confirmed the auth state
    if (isFirebaseUserLoading) {
      return;
    }

    const isAuthPage = pathname === '/login';

    if (appUser) {
      // If we have an app user...
      if (isAuthPage) {
        // ...and we're on the login page, redirect to dashboard.
        router.replace('/dashboard');
      }
      // ...and we're not on the login page, do nothing, let them browse.
    } else {
      // If we DON'T have an app user...
      if (!isAuthPage) {
        // ...and we are NOT on the login page, redirect to login.
        router.replace('/login');
      }
    }
  }, [appUser, isFirebaseUserLoading, pathname, router]);


  // This is the gatekeeper. We show a loading screen if:
  // 1. Firebase is still figuring out who is logged in.
  // 2. We have a user but are still on the login page (waiting for redirect).
  // 3. We have no user and are not on the login page (waiting for redirect).
  const showLoading = isFirebaseUserLoading || (appUser && pathname === '/login') || (!appUser && pathname !== '/login');
  
  if (showLoading) {
    return <LoadingScreen />;
  }

  const contextValue: AuthContextType = { 
      user: appUser, 
      firebaseUser, 
      login, 
      logout, 
      isLoading: isFirebaseUserLoading 
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
