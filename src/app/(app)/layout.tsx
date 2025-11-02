'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  Book,
  Calendar,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldAlert,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { UserNav } from '@/components/layout/user-nav';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'student' | 'teacher')[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'student', 'teacher'] },
  { href: '/profile', label: 'Profile', icon: User, roles: ['student', 'teacher'] },
  { href: '/attendance', label: 'Attendance', icon: CheckCircle2, roles: ['admin', 'teacher'] },
  { href: '/assignments', label: 'Assignments', icon: Book, roles: ['admin', 'student', 'teacher'] },
  { href: '/timetable', label: 'Time Table', icon: Clock, roles: ['student', 'teacher'] },
  { href: '/groups', label: 'Groups', icon: Users, roles: ['admin', 'student', 'teacher'] },
  { href: '/calendar', label: 'Calendar', icon: Calendar, roles: ['admin', 'student', 'teacher'] },
  { href: '/contact-admin', label: 'Contact Admin', icon: ShieldAlert, roles: ['student', 'teacher'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'student', 'teacher'] },
];

function LoadingScreen() {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) {
                    clearInterval(timer);
                    return 95;
                }
                return prev + Math.random() * 10;
            });
        }, 300);

        return () => clearInterval(timer);
    }, []);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <Image 
              src="https://www.mpbfoundationhsschool.com/images/logo.png" 
              alt="M.P. Birla Foundation H.S. School Logo"
              width={150}
              height={150}
              className="mb-8"
              unoptimized
          />
          <div className="w-full max-w-xs">
            <Progress value={progress} className="h-2" />
          </div>
      </div>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  const filteredNavItems = user ? navItems.filter(item => item.roles.includes(user.role)) : [];
  
  const NavLinks = ({isMobile = false}: {isMobile?: boolean}) => (
    <nav className={`grid items-start px-2 text-sm font-medium ${isMobile ? 'gap-2' : 'lg:px-4 gap-1'}`}>
      {filteredNavItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
            pathname.startsWith(href) ? 'bg-muted text-primary' : 'text-muted-foreground'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Icons.logo className="h-6 w-6 text-primary" />
              <span className="font-headline">CampusConnect</span>
            </Link>
          </div>
          <div className="flex-1">
           <NavLinks />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <SheetTitle>Navigation Menu</SheetTitle>
              <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Icons.logo className="h-6 w-6 text-primary" />
                <span className="font-headline">CampusConnect</span>
              </Link>
              <NavLinks isMobile />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
    