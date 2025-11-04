'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Edit, Mail, Phone, User, Home } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { NotAuthorized } from '@/components/not-authorized';
import { Badge } from '@/components/ui/badge';

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
            <h1 className="text-2xl font-bold">Profile</h1>
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
        email: user.email,
        role: "Teacher",
        class: 'Physics, Grade 10',
      }
    : {
        name: studentData.name,
        email: studentData.email,
        role: "Student",
        class: studentData.class,
    }


  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="p-0 relative">
          <div
            className="absolute top-0 left-0 right-0 h-28 sm:h-40 bg-cover bg-center"
            style={{ backgroundImage: `url(${PlaceHolderImages.find(img => img.id === 'profile-banner')?.imageUrl})` }}
            data-ai-hint={PlaceHolderImages.find(img => img.id === 'profile-banner')?.imageHint}
          ><div className="absolute inset-0 bg-black/20"></div></div>
          <div className="relative flex flex-col sm:flex-row items-center pt-16 sm:pt-24 p-6 gap-6">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background z-10">
              <AvatarImage src={studentAvatar?.imageUrl} data-ai-hint={studentAvatar?.imageHint} />
              <AvatarFallback className="text-4xl">{user?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left z-10 flex-grow">
              <CardTitle className="text-2xl sm:text-3xl font-bold">{profileUser.name}</CardTitle>
              <CardDescription className="text-md sm:text-lg text-muted-foreground">{profileUser.class}</CardDescription>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 justify-center sm:justify-start">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4"/> {profileUser.email}</div>
              </div>
            </div>
            <Button variant="outline" size="icon" className="z-10 absolute top-4 right-4 bg-background/50 backdrop-blur-sm border-0 hover:bg-background/80">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {user?.role === 'student' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                  <Card>
                      <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2"><User className="h-5 w-5 text-primary"/> Personal Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                          <div className="flex justify-between"><span className="font-medium text-muted-foreground">Student ID</span> <span>{studentData.id}</span></div>
                          <Separator />
                          <div className="flex justify-between"><span className="font-medium text-muted-foreground">Date of Birth</span> <span>{studentData.dob}</span></div>
                          <Separator />
                          <div className="flex justify-between"><span className="font-medium text-muted-foreground">Guardian</span> <span>{studentData.guardian}</span></div>
                          <Separator />
                          <div className="flex items-center justify-between"><span className="font-medium text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4"/> Contact</span> <span>{studentData.contact}</span></div>
                           <Separator />
                          <div className="flex items-start justify-between"><span className="font-medium text-muted-foreground flex items-center gap-2"><Home className="h-4 w-4"/> Address</span> <span className="text-right">{studentData.address}</span></div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader>
                          <CardTitle className="text-xl">Academic Records</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          {studentData.academicRecords.map(record => (
                              <div key={record.subject}>
                                  <div className="flex justify-between text-sm mb-1">
                                      <span className="font-medium">{record.subject}</span>
                                      <span className="font-semibold text-primary">{record.grade} ({record.score}%)</span>
                                  </div>
                                  <Progress value={record.score} />
                              </div>
                          ))}
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader>
                          <CardTitle className="text-xl">Extracurriculars</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="flex flex-wrap gap-2">
                              {studentData.extracurriculars.map(activity => (
                                  <Badge key={activity} variant="secondary">{activity}</Badge>
                              ))}
                          </div>
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
