'use client';

import { createContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { useFirebaseUser } from '@/firebase/provider'; // Updated import

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'teacher';
  className?: string;
  sectionName?: string;
};

export type AuthContextType = {
  user: User | null; // This is your application-specific user profile
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean; // This combines multiple loading states
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
  const [isAppLoading, setIsAppLoading] = useState(true); // For loading the user profile from localStorage
  const { isLoading: isAuthLoading } = useFirebaseUser(); // Firebase's auth loading state
  const router = useRouter();
  const pathname = usePathname();

  // On initial load, try to get user profile from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('campus-connect-user');
      if (storedUser) {
        setAppUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('campus-connect-user');
    } finally {
      setIsAppLoading(false);
    }
  }, []);

  // This is the single source of truth for loading state across the app
  const isLoading = isAppLoading || isAuthLoading;

  // This effect handles routing based on auth state
  useEffect(() => {
    // If loading is finished and there's no user, redirect to login (unless already there)
    if (!isLoading && !appUser && pathname !== '/login') {
      router.replace('/login');
    }
    // If loading is finished and there IS a user, redirect to dashboard if they are on the login page
    if (!isLoading && appUser && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [appUser, isLoading, pathname, router]);

  const login = (newUser: User) => {
    localStorage.setItem('campus-connect-user', JSON.stringify(newUser));
    setAppUser(newUser);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('campus-connect-user');
    setAppUser(null);
    router.push('/login');
  };
  
  // Show loading screen only if we are in a loading state AND not on the login page.
  // The login page has its own UI and shouldn't be replaced by a loading screen.
  if (isLoading && pathname !== '/login') {
    return <LoadingScreen />;
  }

  // If we are done loading and there is no user, but we are still rendering children (e.g. on the login page),
  // we pass the null user value to the context.
  const contextValue = { user: appUser, login, logout, isLoading };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
