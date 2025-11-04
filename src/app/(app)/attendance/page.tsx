'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { NotAuthorized } from '@/components/not-authorized';

const students = [
  { id: 'S001', name: 'Alex Johnson', class: '10A' },
  { id: 'S002', name: 'Maria Garcia', class: '10A' },
  { id: 'S003', name: 'James Smith', class: '10A' },
  { id: 'S004', name: 'Patricia Williams', class: '10A' },
  { id: 'S005', name: 'Michael Brown', class: '10A' },
];

export default function AttendancePage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-headline font-bold">Attendance</h1>
            <Card><CardContent className="p-6">Loading...</CardContent></Card>
        </div>
    );
  }

  if (user?.role === 'student') {
    return <NotAuthorized />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Attendance</h1>
          <p className="text-muted-foreground">
            Mark attendance for Class 10A for today, {new Date().toLocaleDateString()}.
          </p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Save className="mr-2 h-4 w-4" /> Save Attendance
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center w-[400px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => {
                  const studentAvatar = PlaceHolderImages.find(img => img.id === 'student-avatar');
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={studentAvatar?.imageUrl} data-ai-hint={studentAvatar?.imageHint} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RadioGroup defaultValue="present" className="flex justify-center space-x-2 sm:space-x-8">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="present" id={`${student.id}-present`} />
                            <Label htmlFor={`${student.id}-present`}>Present</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                            <Label htmlFor={`${student.id}-absent`}>Absent</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="late" id={`${student.id}-late`} />
                            <Label htmlFor={`${student.id}-late`}>Late</Label>
                          </div>
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
