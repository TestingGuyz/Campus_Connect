'use client';

import { createContext, useState, ReactNode, useEffect } from 'react';
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
  const [isAppLoading, setIsAppLoading] = useState(true);
  const { user: firebaseUser, isLoading: isAuthLoading } = useFirebaseUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('campus-connect-user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Basic validation of the stored user
        if (parsedUser && parsedUser.id && parsedUser.role) {
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

  const isLoading = isAppLoading || isAuthLoading;

  useEffect(() => {
    if (isLoading) return; // Wait until all loading is complete

    if (!firebaseUser && !appUser && pathname !== '/login') {
      router.replace('/login');
    }
    
    if (firebaseUser && appUser && pathname === '/login') {
        router.replace('/dashboard');
    }

    // This handles the case where firebase auth state is cleared but localStorage isn't
    if (!firebaseUser && appUser) {
        logout();
    }

  }, [appUser, firebaseUser, isLoading, pathname, router]);

  const login = (newUser: User) => {
    localStorage.setItem('campus-connect-user', JSON.stringify(newUser));
    setAppUser(newUser);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('campus-connect-user');
    setAppUser(null);
    // We don't need to call firebase logout here as it will be handled by the auth provider if we want to add it
    router.push('/login');
  };
  
  if (isLoading && pathname !== '/login') {
    return <LoadingScreen />;
  }

  const contextValue = { user: appUser, firebaseUser, login, logout, isLoading };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
