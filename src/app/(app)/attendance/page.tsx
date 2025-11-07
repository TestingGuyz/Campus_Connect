'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { NotAuthorized } from '@/components/not-authorized';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type Student = {
    id: string;
    name: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

export default function AttendancePage() {
  const { user, isAuthLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [classId, setClassId] = useState('10');
  const [sectionId, setSectionId] = useState('A');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const studentsQuery = useMemoFirebase(() => {
    if (isAuthLoading || !firestore || !classId || !sectionId) return null;
    return query(collection(firestore, `classes/${classId}/sections/${sectionId}/students`));
  }, [firestore, classId, sectionId, isAuthLoading]);

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  
  useEffect(() => {
    const fetchAttendance = async () => {
        if (!firestore) return;
        const attendanceDocRef = doc(firestore, 'attendance', today);
        const docSnap = await getDoc(attendanceDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Filter for the current class/section
            const classSectionKey = `${classId}-${sectionId}`;
            if (data[classSectionKey]) {
              setAttendance(data[classSectionKey]);
            } else {
              setAttendance({});
            }
        } else {
            setAttendance({});
        }
    }
    if (classId && sectionId) {
        fetchAttendance();
    }
  }, [firestore, classId, sectionId, today]);


  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!firestore) return;
    setIsSaving(true);
    const attendanceDocRef = doc(firestore, 'attendance', today);
    const classSectionKey = `${classId}-${sectionId}`;
    
    try {
        await setDoc(attendanceDocRef, {
            [classSectionKey]: attendance
        }, { merge: true });
        toast({ title: "Success", description: "Attendance has been saved."});
    } catch (error) {
        console.error("Error saving attendance:", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not save attendance."});
    } finally {
        setIsSaving(false);
    }
  };

  const isLoading = isAuthLoading || isLoadingStudents;

  if (isAuthLoading) {
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
            Mark attendance for {new Date().toLocaleDateString()}.
          </p>
        </div>
        <Button className="mt-4 sm:mt-0" onClick={handleSaveAttendance} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
          Save Attendance
        </Button>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Select Class and Section</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="class-id">Class</Label>
            <Input id="class-id" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="e.g., 10" />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="section-id">Section</Label>
            <Input id="section-id" value={sectionId} onChange={(e) => setSectionId(e.target.value)} placeholder="e.g., A" />
          </div>
        </CardContent>
      </Card>

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
                {isLoading && (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center h-24">Loading students...</TableCell>
                    </TableRow>
                )}
                {!isLoading && students?.map(student => {
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
                        <RadioGroup 
                            value={attendance[student.id] || 'present'} 
                            onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}
                            className="flex justify-center space-x-2 sm:space-x-8"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="present" id={`${student.id}-present`} />
                            <Label htmlFor={`${student.id}-present`}>Present</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                            <Label htmlFor={`${student.id}-absent`}>Absent</Label>                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="late" id={`${student.id}-late`} />
                            <Label htmlFor={`${student.id}-late`}>Late</Label>
                          </div>
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  );
                })}
                 {!isLoading && students?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">No students found for this class/section.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
