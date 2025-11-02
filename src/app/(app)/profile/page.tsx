'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Edit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { NotAuthorized } from '@/components/not-authorized';

const studentData = {
  id: 'stu456',
  name: 'Alex Johnson',
  email: 'student@campus.com',
  class: 'Grade 10 - Section A',
  dob: '2008-05-12',
  guardian: 'Sarah Johnson',
  contact: '+1-202-555-0191',
  address: '456 Oak Avenue, Springfield, IL',
  academicRecords: [
    { subject: 'Mathematics', grade: 'A-', score: 91 },
    { subject: 'Physics', grade: 'B+', score: 88 },
    { subject: 'Literature', grade: 'A', score: 95 },
    { subject: 'History', grade: 'B', score: 84 },
  ],
  extracurriculars: [
    'Science Club (President)',
    'Debate Team',
    'Varsity Soccer',
  ],
};


export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const studentAvatar = PlaceHolderImages.find(img => img.id === 'student-avatar');

  if (isLoading) {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-headline font-bold">Profile</h1>
            <Card><CardContent className="p-6">Loading...</CardContent></Card>
        </div>
    );
  }

  if (user?.role !== 'student' && user?.role !== 'teacher') {
    return <NotAuthorized />;
  }

  const profileUser = user?.role === 'teacher' 
    ? {
        name: user.name,
        class: 'Teacher',
      }
    : {
        name: studentData.name,
        class: studentData.class,
    }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative">
          <div
            className="absolute top-0 left-0 right-0 h-32 rounded-t-lg bg-cover bg-center"
            style={{ backgroundImage: `url(${PlaceHolderImages.find(img => img.id === 'profile-banner')?.imageUrl})` }}
            data-ai-hint={PlaceHolderImages.find(img => img.id === 'profile-banner')?.imageHint}
          ></div>
          <div className="flex flex-col sm:flex-row items-center pt-20 gap-6">
            <Avatar className="h-32 w-32 border-4 border-background z-10">
              <AvatarImage src={studentAvatar?.imageUrl} data-ai-hint={studentAvatar?.imageHint} />
              <AvatarFallback className="text-4xl">{user?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left z-10">
              <CardTitle className="text-3xl font-headline">{profileUser.name}</CardTitle>
              <CardDescription>{profileUser.class}</CardDescription>
            </div>
            <Button variant="outline" size="icon" className="absolute top-36 right-6 z-10">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {user?.role === 'student' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                  <Card>
                      <CardHeader>
                          <CardTitle>Personal Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                          <div className="flex justify-between"><span className="font-medium text-muted-foreground">Student ID</span> <span>{studentData.id}</span></div>
                          <Separator />
                          <div className="flex justify-between"><span className="font-medium text-muted-foreground">Email</span> <span>{studentData.email}</span></div>
                          <Separator />
                          <div className="flex justify-between"><span className="font-medium text-muted-foreground">Date of Birth</span> <span>{studentData.dob}</span></div>
                          <Separator />
                          <div className="flex justify-between"><span className="font-medium text-muted-foreground">Guardian</span> <span>{studentData.guardian}</span></div>
                          <Separator />
                          <div className="flex justify-between"><span className="font-medium text-muted-foreground">Contact</span> <span>{studentData.contact}</span></div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader>
                          <CardTitle>Academic Records</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          {studentData.academicRecords.map(record => (
                              <div key={record.subject}>
                                  <div className="flex justify-between text-sm mb-1">
                                      <span className="font-medium">{record.subject}</span>
                                      <span>{record.grade} ({record.score}%)</span>
                                  </div>
                                  <Progress value={record.score} />
                              </div>
                          ))}
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader>
                          <CardTitle>Extracurricular Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <ul className="list-disc list-inside space-y-2 text-sm">
                              {studentData.extracurriculars.map(activity => (
                                  <li key={activity}>{activity}</li>
                              ))}
                          </ul>
                      </CardContent>
                  </Card>
              </div>
          ) : (
             <Card><CardContent className='p-6 text-center text-muted-foreground'>Teacher profile details will be displayed here.</CardContent></Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
