'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export function NotAuthorized() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
            <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <CardTitle className="mt-4 text-2xl">Access Denied</CardTitle>
        <CardDescription>You do not have the required permissions to view this page.</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
