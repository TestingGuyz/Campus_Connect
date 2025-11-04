'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function AdminSettings() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [classId, setClassId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddStudent = async () => {
        if (!firestore || !name || !classId || !sectionId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
            return;
        }
        setIsSubmitting(true);
        const studentData = { name };
        try {
            const studentCollectionRef = collection(firestore, `classes/${classId}/sections/${sectionId}/students`);
            await addDoc(studentCollectionRef, studentData);
            toast({ title: 'Success', description: `Student ${name} added to class ${classId}-${sectionId}.` });
            setName('');
            setClassId('');
            setSectionId('');
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: `classes/${classId}/sections/${sectionId}/students`,
                operation: 'create',
                requestResourceData: studentData
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add student.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin Controls</CardTitle>
                <CardDescription>Manage students, classes, and sections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className='space-y-2'>
                    <h3 className='font-medium'>Add New Student</h3>
                    <div className="space-y-2">
                        <Label htmlFor="student-name">Student Full Name</Label>
                        <Input id="student-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jane Doe" />
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className="space-y-2">
                            <Label htmlFor="student-class">Class</Label>
                            <Input id="student-class" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="e.g., 10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="student-section">Section</Label>
                            <Input id="student-section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} placeholder="e.g., B" />
                        </div>
                    </div>
                    <Button onClick={handleAddStudent} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Add Student
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SettingsPage() {
  const { user, logout, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <Card><CardContent className="p-6">Loading settings...</CardContent></Card>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-headline font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings.</p>
      </div>

      {user?.role === 'admin' && <AdminSettings />}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how others will see you on the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={user?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email} />
          </div>
          <Button>Update Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button>Change Password</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5 mb-2 sm:mb-0">
                  <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications about assignments and announcements via email.</p>
              </div>
              <Switch id="email-notifications" />
          </div>
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5 mb-2 sm:mb-0">
                  <Label htmlFor="push-notifications" className="text-base">Push Notifications</Label>
                   <p className="text-sm text-muted-foreground">Get push notifications on your devices.</p>
              </div>
              <Switch id="push-notifications" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>These actions are irreversible.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border border-destructive p-4">
              <div className="space-y-0.5 mb-2 sm:mb-0">
                  <h4 className="font-medium">Log out</h4>
                  <p className="text-sm text-muted-foreground">You will be returned to the login screen.</p>
              </div>
              <Button variant="outline" onClick={logout}>Log Out</Button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border border-destructive p-4">
              <div className="space-y-0.5 mb-2 sm:mb-0">
                  <h4 className="font-medium text-destructive">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
              </div>
              <Button variant="destructive">Delete My Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
