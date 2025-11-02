'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookCheck, BookMarked, CalendarCheck, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

const upcomingClasses = [
    { time: '9:00 AM', subject: 'Mathematics', teacher: 'Mr. Davison', location: 'Room 301' },
    { time: '10:00 AM', subject: 'Physics', teacher: 'Ms. Curie', location: 'Lab A' },
    { time: '11:00 AM', subject: 'Literature', teacher: 'Mr. Poe', location: 'Room 204' },
];

type Assignment = {
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    classId: string;
    sectionId: string;
};

type SchoolEvent = {
  id: string;
  date: string;
  title: string;
  type: 'meeting' | 'event' | 'academic' | 'holiday' | 'other';
  priority: 'High' | 'Medium' | 'Low';
};

const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
}


export default function StudentDashboard() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const assignmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.className || !user?.sectionName) return null;
        return query(
            collection(firestore, 'assignments'), 
            where('classId', '==', user.className),
            where('sectionId', '==', user.sectionName)
        );
    }, [firestore, user]);
  const { data: assignments, isLoading: isLoadingAssignments } = useCollection<Assignment>(assignmentsQuery);
  const upcomingAssignments = assignments
    ?.filter(a => new Date(a.dueDate) >= new Date())
    .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3) || [];
  
  const eventsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'events') : null, [firestore]);
  const { data: events, isLoading: isLoadingEvents } = useCollection<SchoolEvent>(eventsQuery);

  const highPriorityEvents = events?.filter(e => e.priority === 'High' && new Date(e.date) >= new Date())
                                   .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                   .slice(0, 3) || [];


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome back, {user?.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's your summary for today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <BookCheck className="h-5 w-5 text-secondary" />
                    Semester Progress
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium">Attendance</span>
                        <span className="text-sm font-bold">92%</span>
                    </div>
                    <Progress value={92} aria-label="Attendance progress" />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium">Assignments Completed</span>
                        <span className="text-sm font-bold">75%</span>
                    </div>
                    <Progress value={75} aria-label="Assignments progress" />
                </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium">Overall Grade</span>
                        <span className="text-sm font-bold">88% (B+)</span>
                    </div>
                    <Progress value={88} aria-label="Overall grade progress" />
                </div>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-secondary" />
                Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {upcomingClasses.map((c, i) => (
                    <div key={i} className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 text-secondary mr-4">
                            <span className="font-bold text-sm">{c.time.split(' ')[0].split(':')[0]}</span>
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold">{c.subject}</p>
                            <p className="text-sm text-muted-foreground">{c.teacher} &middot; {c.location}</p>
                        </div>
                        <Badge variant={i === 0 ? "default" : "outline"} className={`${i === 0 ? 'bg-primary' : ''}`}>
                            {i === 0 ? 'In Progress' : 'Upcoming'}
                        </Badge>
                    </div>
                ))}
            </div>
            <Button variant="outline" className="mt-6 w-full" asChild>
                <Link href="/timetable">View Full Timetable <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <BookMarked className="h-5 w-5 text-secondary" />
                    Upcoming Assignments
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {isLoadingAssignments ? <p>Loading assignments...</p> : upcomingAssignments.map((a) => (
                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                            <p className="font-semibold">{a.title}</p>
                            <p className="text-sm text-muted-foreground">{a.subject}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 sm:mt-0">
                            <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground hover:bg-secondary/30">Due: {new Date(a.dueDate).toLocaleDateString()}</Badge>
                            <Button size="sm" asChild><Link href="/assignments">View</Link></Button>
                        </div>
                    </div>
                ))}
                 {upcomingAssignments.length === 0 && !isLoadingAssignments && <p className="text-sm text-muted-foreground">No upcoming assignments.</p>}
                </div>
                <Button variant="outline" className="mt-6 w-full" asChild>
                    <Link href="/assignments">View All Assignments <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarCheck className="h-5 w-5 text-destructive" />
                    High-Priority Events
                </CardTitle>
            </CardHeader>
            <CardContent>
                 {isLoadingEvents ? <p>Loading events...</p> : (
                    <ul className="space-y-3">
                        {highPriorityEvents.map(event => (
                            <li key={event.id} className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-medium">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(event.date + 'T00:00:00').toLocaleDateString()}</p>
                                </div>
                                <Badge variant={getPriorityBadge(event.priority)}>{event.priority}</Badge>
                            </li>
                        ))}
                         {highPriorityEvents.length === 0 && <p className="text-sm text-muted-foreground">No high-priority events.</p>}
                    </ul>
                )}
                 <Button variant="outline" className="mt-6 w-full" asChild>
                    <Link href="/calendar">View Full Calendar <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
