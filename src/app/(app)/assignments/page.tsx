'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileText, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


// Types to match Firestore data model
type Assignment = {
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    fileUrl?: string;
    fileName?: string;
    classId: string;
    sectionId: string;
    createdAt: any;
};

type StudentAssignment = {
    id: string;
    assignmentId: string;
    studentId: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
};

const getPriorityBadgeVariant = (priority: string) => {
  switch (priority) {
    case 'High': return 'destructive';
    case 'Medium': return 'secondary';
    case 'Low': return 'outline';
    default: return 'outline';
  }
};

function TeacherView() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, isLoading: isAuthLoading } = useAuth();
    
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [classId, setClassId] = useState('');
    const [sectionId, setSectionId] = useState('');
    
    const assignmentsQuery = useMemoFirebase(() => {
        // CRITICAL: Wait for auth to be loaded and user to be present.
        if (isAuthLoading || !user || !firestore) return null;
        return query(collection(firestore, 'assignments'));
    }, [firestore, user, isAuthLoading]);

    const { data: assignments, isLoading } = useCollection<Assignment>(assignmentsQuery);

    const handleCreateAssignment = () => {
        if (!firestore || !title || !subject || !dueDate || !classId || !sectionId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
            return;
        }

        addDoc(collection(firestore, 'assignments'), {
            title,
            subject,
            dueDate,
            classId,
            sectionId,
            createdAt: serverTimestamp(),
        }).then(() => {
            toast({ title: 'Success', description: 'Assignment created successfully.' });
            // Reset form
            setTitle(''); setSubject(''); setDueDate(''); setClassId(''); setSectionId('');
        }).catch(error => {
            console.error(error);
            const permissionError = new FirestorePermissionError({
                path: 'assignments',
                operation: 'create',
                requestResourceData: { title, subject, dueDate, classId, sectionId }
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create assignment.' });
        });
    };

    const handleDeleteAssignment = (assignmentId: string) => {
        if (!firestore) return;
        
        deleteDoc(doc(firestore, 'assignments', assignmentId))
            .then(() => {
                toast({ title: 'Success', description: 'Assignment deleted.' });
            })
            .catch(error => {
                console.error(error);
                const permissionError = new FirestorePermissionError({
                    path: `assignments/${assignmentId}`,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not delete assignment.' });
            });
    }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create New Assignment</CardTitle>
          <CardDescription>Upload assignments and set deadlines for students.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g., Biology Chapter 5 Notes" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="e.g., Biology" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="classId">Class</Label>
                  <Input id="classId" placeholder="e.g., 10" value={classId} onChange={e => setClassId(e.target.value)} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="sectionId">Section</Label>
                  <Input id="sectionId" placeholder="e.g., A" value={sectionId} onChange={e => setSectionId(e.target.value)} />
              </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File (Optional)</Label>
            <Input id="file" type="file" />
          </div>
          <Button className="w-full" onClick={handleCreateAssignment}>
            <Upload className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Assignments</CardTitle>
          <CardDescription>A list of assignments you have already created.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {isLoading && <p>Loading...</p>}
            {assignments?.map(a => (
                <li key={a.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{a.title}</p>
                            <p className="text-sm text-muted-foreground">{a.subject} | {a.classId}{a.sectionId} - Due: {a.dueDate}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button variant="ghost" size="icon" disabled>
                          <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteAssignment(a.id)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentView() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    // 1. Fetch assignments for the student's class
    const assignmentsQuery = useMemoFirebase(() => {
        // CRITICAL: Wait for auth to be loaded and user to have class info.
        if (isAuthLoading || !user?.className || !user?.sectionName || !firestore) return null;
        return query(
            collection(firestore, 'assignments'), 
            where('classId', '==', user.className),
            where('sectionId', '==', user.sectionName)
        );
    }, [firestore, user, isAuthLoading]);
    const { data: classAssignments, isLoading: isLoadingAssignments } = useCollection<Assignment>(assignmentsQuery);
    
    // 2. Fetch student's specific assignment data (priorities, statuses)
    const studentAssignmentsQuery = useMemoFirebase(() => {
        // CRITICAL: Wait for auth to be loaded and user to be present.
        if(isAuthLoading || !user || !firestore) return null;
        return query(collection(firestore, 'student-assignments'), where('studentId', '==', user.id));
    }, [firestore, user, isAuthLoading]);
    const { data: studentAssignmentsData, isLoading: isLoadingStudentData } = useCollection<StudentAssignment>(studentAssignmentsQuery);
    
    // 3. Combine the data
    const [combinedAssignments, setCombinedAssignments] = useState<(Assignment & Partial<StudentAssignment>)[]>([]);

    useEffect(() => {
        if (classAssignments) {
            const combined = classAssignments.map(assignment => {
                const studentData = studentAssignmentsData?.find(sa => sa.assignmentId === assignment.id);
                return {
                    ...assignment,
                    status: studentData?.status || 'Not Started',
                    priority: studentData?.priority || 'Medium',
                    studentAssignmentId: studentData?.id, // for updates
                };
            });
            setCombinedAssignments(combined);
        }
    }, [classAssignments, studentAssignmentsData]);


    const handleStudentAssignmentChange = (assignmentId: string, studentAssignmentId: string | undefined, field: 'status' | 'priority', value: string) => {
        if (!firestore || !user) return;
        
        if (studentAssignmentId) {
            // Update existing doc
            const docRef = doc(firestore, 'student-assignments', studentAssignmentId);
            updateDoc(docRef, { [field]: value })
                .then(() => toast({ title: 'Updated!', description: `Assignment ${field} set to ${value}.`}))
                .catch(error => {
                    console.error("Failed to update assignment", error);
                    const permissionError = new FirestorePermissionError({
                        path: `student-assignments/${studentAssignmentId}`,
                        operation: 'update',
                        requestResourceData: { [field]: value }
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not update assignment.'})
                });
        } else {
            // Create new doc for a status that didn't exist
            const payload = {
                studentId: user.id,
                assignmentId: assignmentId,
                status: field === 'status' ? value as StudentAssignment['status'] : 'Not Started',
                priority: field === 'priority' ? value as StudentAssignment['priority'] : 'Medium',
            };
            addDoc(collection(firestore, 'student-assignments'), payload)
                .then(() => toast({ title: 'Updated!', description: `Assignment ${field} set to ${value}.`}))
                .catch(error => {
                    console.error("Failed to create assignment data", error);
                    const permissionError = new FirestorePermissionError({
                        path: 'student-assignments',
                        operation: 'create',
                        requestResourceData: payload
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not update assignment.'})
                });
        }
    }


  if (isLoadingAssignments || isLoadingStudentData || isAuthLoading) {
      return <Card><CardContent className="p-6">Loading assignments...</CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Assignments</CardTitle>
        <CardDescription>Here is a list of your current and past assignments.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Subject</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinedAssignments.map(assignment => (
              <TableRow key={assignment.id} className={assignment.status === 'Completed' ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox 
                    checked={assignment.status === 'Completed'} 
                    onCheckedChange={(checked) => handleStudentAssignmentChange(assignment.id, (assignment as any).studentAssignmentId, 'status', checked ? 'Completed' : 'In Progress')}
                  />
                </TableCell>
                <TableCell className={`font-medium ${assignment.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{assignment.title}</TableCell>
                <TableCell className={`hidden sm:table-cell ${assignment.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{assignment.subject}</TableCell>
                <TableCell className={`hidden md:table-cell ${assignment.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{assignment.dueDate}</TableCell>
                <TableCell>
                  <Select 
                    defaultValue={assignment.priority}
                    onValueChange={(value) => handleStudentAssignmentChange(assignment.id, (assignment as any).studentAssignmentId, 'priority', value)}
                  >
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High"><Badge variant={getPriorityBadgeVariant("High")}>High</Badge></SelectItem>
                      <SelectItem value="Medium"><Badge variant={getPriorityBadgeVariant("Medium")}>Medium</Badge></SelectItem>
                      <SelectItem value="Low"><Badge variant={getPriorityBadgeVariant("Low")}>Low</Badge></SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AssignmentsPage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-2xl font-headline font-bold">Assignments</h1>
                <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
            <Card>
                <CardContent className="p-6">Loading assignments...</CardContent>
            </Card>
        </div>
    );
  }

  const canManageAssignments = user?.role === 'admin' || user?.role === 'teacher';

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">
            {canManageAssignments ? 'Assignments Management' : 'Assignments To-Do'}
          </h1>
          <p className="text-muted-foreground">
            {canManageAssignments ? 'Manage and distribute assignments.' : 'Track and submit your work.'}
          </p>
        </div>
      </div>

      {canManageAssignments ? <TeacherView /> : <StudentView />}
    </div>
  );
}
