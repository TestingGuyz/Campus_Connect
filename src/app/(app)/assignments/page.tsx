'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileText, Check, Trash2, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';

const assignments = [
  { id: 1, title: 'History of Ancient Rome Essay', subject: 'History', dueDate: '2024-10-25', status: 'Completed', priority: 'High' },
  { id: 2, title: 'Calculus Problem Set 5', subject: 'Mathematics', dueDate: '2024-10-28', status: 'In Progress', priority: 'High' },
  { id: 3, title: 'Shakespeare Sonnet Analysis', subject: 'Literature', dueDate: '2024-11-02', status: 'Not Started', priority: 'Medium' },
  { id: 4, title: 'Physics Lab Report: Optics', subject: 'Physics', dueDate: '2024-11-05', status: 'Not Started', priority: 'Low' },
  { id: 5, title: 'Market Research Project', subject: 'Business', dueDate: '2024-11-10', status: 'Completed', priority: 'Medium' },
];

const getPriorityBadgeVariant = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'secondary';
    case 'Low':
      return 'outline';
    default:
      return 'outline';
  }
};


function TeacherView() {
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
            <Input id="title" placeholder="e.g., Biology Chapter 5 Notes" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="e.g., Biology" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input id="file" type="file" />
          </div>
          <Button className="w-full">
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
            {assignments.slice(0, 3).map(a => (
                <li key={a.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{a.title}</p>
                            <p className="text-sm text-muted-foreground">{a.subject} - Due: {a.dueDate}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon">
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
            {assignments.map(assignment => (
              <TableRow key={assignment.id} className={assignment.status === 'Completed' ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox checked={assignment.status === 'Completed'} />
                </TableCell>
                <TableCell className={`font-medium ${assignment.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{assignment.title}</TableCell>
                <TableCell className={`hidden sm:table-cell ${assignment.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{assignment.subject}</TableCell>
                <TableCell className={`hidden md:table-cell ${assignment.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{assignment.dueDate}</TableCell>
                <TableCell>
                  <Select defaultValue={assignment.priority}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High"><Badge variant="destructive">High</Badge></SelectItem>
                      <SelectItem value="Medium"><Badge variant="secondary">Medium</Badge></SelectItem>
                      <SelectItem value="Low"><Badge variant="outline">Low</Badge></SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
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
  const { user } = useAuth();
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">
            {user?.role === 'admin' ? 'Assignments Management' : 'Assignments To-Do'}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === 'admin' ? 'Manage and distribute assignments.' : 'Track and submit your work.'}
          </p>
        </div>
      </div>

      {user?.role === 'admin' ? <TeacherView /> : <StudentView />}
    </div>
  );
}
    