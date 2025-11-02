'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const assignments = [
  { id: 1, title: 'History of Ancient Rome Essay', subject: 'History', dueDate: '2024-10-25', status: 'Submitted' },
  { id: 2, title: 'Calculus Problem Set 5', subject: 'Mathematics', dueDate: '2024-10-28', status: 'Graded' },
  { id: 3, title: 'Shakespeare Sonnet Analysis', subject: 'Literature', dueDate: '2024-11-02', status: 'Not Submitted' },
  { id: 4, title: 'Physics Lab Report: Optics', subject: 'Physics', dueDate: '2024-11-05', status: 'Not Submitted' },
  { id: 5, title: 'Market Research Project', subject: 'Business', dueDate: '2024-11-10', status: 'Submitted' },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Submitted':
      return 'secondary';
    case 'Graded':
      return 'default';
    case 'Not Submitted':
      return 'destructive';
    default:
      return 'outline';
  }
};

function TeacherView() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Material</CardTitle>
          <CardDescription>Upload assignments, study materials, or event details for students.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g., Biology Chapter 5 Notes" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="e.g., Biology" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input id="file" type="file" />
          </div>
          <Button className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>A list of materials you have already uploaded.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {assignments.slice(0, 3).map(a => (
                <li key={a.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{a.title}</p>
                            <p className="text-sm text-muted-foreground">{a.subject}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentView() {
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
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Subject</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map(assignment => (
              <TableRow key={assignment.id}>
                <TableCell className="font-medium">{assignment.title}</TableCell>
                <TableCell className="hidden sm:table-cell">{assignment.subject}</TableCell>
                <TableCell className="hidden md:table-cell">{assignment.dueDate}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={getStatusBadgeVariant(assignment.status)}>{assignment.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    {assignment.status === 'Not Submitted' ? <Upload className="h-4 w-4" /> : <Download className="h-4 w-4" />}
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
  const { user } = useAuth();
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">
            {user?.role === 'admin' ? 'Resources Management' : 'Assignments & Resources'}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === 'admin' ? 'Manage and distribute educational materials.' : 'Access your course materials and submit your work.'}
          </p>
        </div>
      </div>

      {user?.role === 'admin' ? <TeacherView /> : <StudentView />}
    </div>
  );
}
