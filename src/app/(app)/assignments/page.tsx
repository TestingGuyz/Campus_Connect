'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileText, Trash2, Edit } from 'lucide-react';
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
    const { user, isAuthLoading } = useAuth();
    
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [classId, setClassId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    
    const assignmentsQuery = useMemoFirebase(() => {
        if (isAuthLoading || !user || !firestore) return null;
        return query(collection(firestore, 'assignments'));
    }, [firestore, user, isAuthLoading]);

    const { data: assignments, isLoading } = useCollection<Assignment>(assignmentsQuery);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleCreateAssignment = () => {
        if (!firestore || !title || !subject || !dueDate || !classId || !sectionId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
            return;
        }

        const assignmentData: Omit<Assignment, 'id'> = {
            title,
            subject,
            dueDate,
            classId,
            sectionId,
            createdAt: serverTimestamp(),
        };

        // Mock file upload by creating a placeholder URL
        if (file) {
            assignmentData.fileName = file.name;
            // In a real app, you would upload to a service like Firebase Storage and get a URL.
            // Here, we'll use a placeholder URL for demonstration.
            assignmentData.fileUrl = 'https://picsum.photos/seed/document/600/400';
            toast({title: "File Attached", description: `${file.name} is ready for upload.`});
        }


        addDoc(collection(firestore, 'assignments'), assignmentData).then(() => {
            toast({ title: 'Success', description: 'Assignment created successfully.' });
            // Reset form
            setTitle(''); setSubject(''); setDueDate(''); setClassId(''); setSectionId(''); setFile(null);
            const fileInput = document.getElementById('file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }).catch(error => {
            const permissionError = new FirestorePermissionError({
                path: 'assignments',
                operation: 'create',
                requestResourceData: assignmentData
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
                const permissionError = new FirestorePermissionError({
                    path: `assignments/${assignmentId}`,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not delete assignment.' });
            });
    }
    
    if (isLoading || isAuthLoading) {
        return <p>Loading assignments...</p>
    }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Create New Assignment</CardTitle>
          <CardDescription>Fill out the form to create and distribute a new assignment.</CardDescription>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Label htmlFor="file">Attach File (Optional)</Label>
            <Input id="file" type="file" onChange={handleFileChange} />
          </div>
          <Button className="w-full" onClick={handleCreateAssignment}>
            <Upload className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Uploaded Assignments</CardTitle>
          <CardDescription>A list of assignments you have already created.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <ul className="space-y-3 min-w-[500px]">
              {assignments?.map(a => (
                  <li key={a.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4">
                      <div className="flex items-center gap-4">
                          <FileText className="h-6 w-6 text-primary" />
                          <div>
                              <p className="font-medium">{a.title}</p>
                              <p className="text-sm text-muted-foreground">{a.subject} | Class {a.classId}{a.sectionId} - Due: {a.dueDate}</p>
                          </div>
                      </div>
                      <div className='flex items-center gap-2 shrink-0'>
                        <Button variant="ghost" size="icon" disabled={!a.fileUrl} onClick={() => a.fileUrl && window.open(a.fileUrl, '_blank')}>
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteAssignment(a.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                  </li>
              ))}
              {assignments?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No assignments created yet.</p>}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentView() {
    const { user, isAuthLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const assignmentsQuery = useMemoFirebase(() => {
        if (isAuthLoading || !user?.className || !user?.sectionName || !firestore) return null;
        return query(
            collection(firestore, 'assignments'), 
            where('classId', '==', user.className),
            where('sectionId', '==', user.sectionName)
        );
    }, [firestore, user, isAuthLoading]);
    const { data: classAssignments, isLoading: isLoadingAssignments } = useCollection<Assignment>(assignmentsQuery);
    
    const studentAssignmentsQuery = useMemoFirebase(() => {
        if(isAuthLoading || !user || !firestore) return null;
        return query(collection(firestore, 'student-assignments'), where('studentId', '==', user.id));
    }, [firestore, user, isAuthLoading]);
    const { data: studentAssignmentsData, isLoading: isLoadingStudentData } = useCollection<StudentAssignment>(studentAssignmentsQuery);
    
    const [combinedAssignments, setCombinedAssignments] = useState<(Assignment & Partial<StudentAssignment>)[]>([]);

    useEffect(() => {
        if (!classAssignments) {
            setCombinedAssignments([]);
            return;
        }

        const studentDataMap = new Map(studentAssignmentsData?.map(sa => [sa.assignmentId, sa]));

        const combined = classAssignments.map(assignment => {
            const studentData = studentDataMap.get(assignment.id);
            return {
                ...assignment,
                status: studentData?.status || 'Not Started',
                priority: studentData?.priority || 'Medium',
                studentAssignmentId: studentData?.id,
            };
        });
        setCombinedAssignments(combined);

    }, [classAssignments, studentAssignmentsData]);


    const handleStudentAssignmentChange = (assignmentId: string, studentAssignmentId: string | undefined, field: 'status' | 'priority', value: string) => {
        if (!firestore || !user) return;
        
        if (studentAssignmentId) {
            const docRef = doc(firestore, 'student-assignments', studentAssignmentId);
            updateDoc(docRef, { [field]: value })
                .then(() => toast({ title: 'Updated!', description: `Assignment ${field} set to ${value}.`}))
                .catch(error => {
                    const permissionError = new FirestorePermissionError({
                        path: `student-assignments/${studentAssignmentId}`,
                        operation: 'update',
                        requestResourceData: { [field]: value }
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not update assignment.'})
                });
        } else {
            const payload = {
                studentId: user.id,
                assignmentId: assignmentId,
                status: field === 'status' ? value as StudentAssignment['status'] : 'Not Started',
                priority: field === 'priority' ? value as StudentAssignment['priority'] : 'Medium',
            };
            addDoc(collection(firestore, 'student-assignments'), payload)
                .then(() => toast({ title: 'Updated!', description: `Assignment ${field} set to ${value}.`}))
                .catch(error => {
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

  const isLoading = isLoadingAssignments || isLoadingStudentData || isAuthLoading;
  
  if (isLoading) {
      return <Card><CardContent className="p-6">Loading assignments...</CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Assignments</CardTitle>
        <CardDescription>Here is a list of your current and past assignments.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
            <Table className="min-w-[600px]">
            <TableHeader>
                <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {combinedAssignments.length > 0 ? (
                    combinedAssignments.map(assignment => (
                    <TableRow key={assignment.id} className={assignment.status === 'Completed' ? 'bg-muted/50' : ''}>
                        <TableCell>
                        <Checkbox 
                            checked={assignment.status === 'Completed'} 
                            onCheckedChange={(checked) => handleStudentAssignmentChange(assignment.id, (assignment as any).studentAssignmentId, 'status', checked ? 'Completed' : 'In Progress')}
                        />
                        </TableCell>
                        <TableCell className={`font-medium ${assignment.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{assignment.title}</TableCell>
                        <TableCell className={`${assignment.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{assignment.subject}</TableCell>
                        <TableCell className={`${assignment.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{assignment.dueDate}</TableCell>
                        <TableCell>
                        <Select 
                            defaultValue={assignment.priority}
                            onValueChange={(value) => handleStudentAssignmentChange(assignment.id, (assignment as any).studentAssignmentId, 'priority', value)}
                        >
                            <SelectTrigger className="w-[120px] h-8 text-xs focus:ring-0 border-0 bg-transparent">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="High"><Badge variant={getPriorityBadgeVariant("High")}>High Priority</Badge></SelectItem>
                            <SelectItem value="Medium"><Badge variant={getPriorityBadgeVariant("Medium")}>Medium Priority</Badge></SelectItem>
                            <SelectItem value="Low"><Badge variant={getPriorityBadgeVariant("Low")}>Low Priority</Badge></SelectItem>
                            </SelectContent>
                        </Select>
                        </TableCell>
                        <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled={!assignment.fileUrl} onClick={() => assignment.fileUrl && window.open(assignment.fileUrl, '_blank')}>
                            <Download className="h-4 w-4" />
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                            No assignments found for your class. Great job staying on top of your work!
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssignmentsPage() {
  const { user, isAuthLoading } = useAuth();
  
  if (isAuthLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold">Assignments</h1>
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
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {canManageAssignments ? 'Assignments Management' : 'Assignments To-Do'}
          </h1>
          <p className="text-muted-foreground">
            {canManageAssignments ? 'Manage and distribute assignments for your classes.' : 'Track and submit your work on time.'}
          </p>
        </div>
      </div>

      {canManageAssignments ? <TeacherView /> : <StudentView />}
    </div>
  );
}
