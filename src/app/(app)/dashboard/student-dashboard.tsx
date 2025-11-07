'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookMarked, CalendarCheck, CalendarDays, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

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

type TimetableDay = {
  period1: string; period2: string; period3: string; period4: string;
  period5: string; period6: string; period7: string; period8: string;
};
type TimetableData = {
  Monday: TimetableDay; Tuesday: TimetableDay; Wednesday: TimetableDay;
  Thursday: TimetableDay; Friday: TimetableDay;
};
const periodTimes = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "12:40 PM", "1:20 PM", "2:00 PM", "3:00 PM"];


const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
}


export default function StudentDashboard() {
  const { user, isAuthLoading } = useAuth();
  const firestore = useFirestore();
  const [todaysSchedule, setTodaysSchedule] = useState<{ time: string, subject: string, isCurrent: boolean }[]>([]);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.className || !user?.sectionName) return null;
    return query(
        collection(firestore, 'assignments'),
        where('classId', '==', user.className),
        where('sectionId', '==', user.sectionName)
    );
  }, [firestore, user]);

  const { data: assignments, isLoading: isLoadingAssignments } = useCollection<Assignment>(assignmentsQuery);
  
  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'events'));
  }, [firestore]);
  const { data: events, isLoading: isLoadingEvents } = useCollection<SchoolEvent>(eventsQuery);

  useEffect(() => {
    const fetchTimetable = async () => {
        if (!firestore || !user?.className || !user?.sectionName) return;

        const timetableDocRef = doc(firestore, `classes/${user.className}/sections/${user.sectionName}/timetable/schedule`);
        const docSnap = await getDoc(timetableDocRef);

        if (docSnap.exists()) {
            const timetable = docSnap.data() as TimetableData;
            const today = new Date();
            const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' }) as keyof TimetableData;
            const now = today.getHours() * 60 + today.getMinutes();

            if (timetable[dayOfWeek]) {
                const scheduleForToday = Object.entries(timetable[dayOfWeek]).map(([period, subject], index) => {
                    const time = periodTimes[index];
                    const [hour, minutePart] = time.split(':');
                    const minutes = parseInt(minutePart.split(' ')[0]);
                    const isPM = minutePart.includes('PM');
                    let periodStartMinutes = parseInt(hour) * 60 + minutes;
                    if (isPM && parseInt(hour) !== 12) periodStartMinutes += 12 * 60;

                    return {
                        time: time,
                        subject: subject,
                        isCurrent: now >= periodStartMinutes && now < periodStartMinutes + 60
                    }
                }).filter(item => item.subject && item.subject.toLowerCase() !== 'break' && item.subject.toLowerCase() !== 'tiffin');

                setTodaysSchedule(scheduleForToday);
            }
        }
    };
    
    if(!isAuthLoading) {
      fetchTimetable();
    }
}, [firestore, user, isAuthLoading]);

  const isLoading = isAuthLoading || isLoadingAssignments || isLoadingEvents;
  
  const upcomingAssignments = assignments
    ?.filter(a => new Date(a.dueDate) >= new Date())
    .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3) || [];
  
  const highPriorityEvents = events?.filter(e => e.priority === 'High' && new Date(e.date) >= new Date())
                                   .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                   .slice(0, 3) || [];

  if (isLoading) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold">Welcome back...</h1>
                <p className="text-muted-foreground">Loading your summary...</p>
            </div>
             <Card><CardContent className="p-6">Loading dashboard...</CardContent></Card>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's your summary for today. Keep up the great work!</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Semester Progress
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium">Attendance</span>
                        <span className="text-sm font-bold text-primary">92%</span>
                    </div>
                    <Progress value={92} aria-label="Attendance progress" />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium">Assignments Completed</span>
                        <span className="text-sm font-bold text-primary">75%</span>
                    </div>
                    <Progress value={75} aria-label="Assignments progress" />
                </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium">Overall Grade</span>
                        <span className="text-sm font-bold text-primary">88% (B+)</span>
                    </div>
                    <Progress value={88} aria-label="Overall grade progress" />
                </div>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary" />
                Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {todaysSchedule.length > 0 ? todaysSchedule.map((c, i) => (
                    <div key={i} className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mr-4 shrink-0">
                            <span className="font-bold text-sm">{c.time.split(' ')[0]}</span>
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold">{c.subject}</p>
                        </div>
                        <Badge variant={c.isCurrent ? "default" : "secondary"}>
                            {c.isCurrent ? 'In Progress' : 'Upcoming'}
                        </Badge>
                    </div>
                )) : <p className="text-sm text-muted-foreground text-center py-4">No classes scheduled for today.</p>}
            </div>
            <Button variant="outline" className="mt-6 w-full" asChild>
                <Link href="/timetable">View Full Timetable <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <BookMarked className="h-5 w-5 text-primary" />
                    Upcoming Assignments
                </CardTitle>
                 <CardDescription>Keep track of your deadlines.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {upcomingAssignments.map((a) => (
                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-muted">
                        <div>
                            <p className="font-semibold">{a.title}</p>
                            <p className="text-sm text-muted-foreground">{a.subject}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 sm:mt-0">
                            <Badge variant="secondary">Due: {new Date(a.dueDate  + 'T00:00:00').toLocaleDateString()}</Badge>
                            <Button size="sm" asChild><Link href="/assignments">View</Link></Button>
                        </div>
                    </div>
                ))}
                 {upcomingAssignments.length === 0 && <p className="text-sm text-muted-foreground">No upcoming assignments. You're all caught up!</p>}
                </div>
                <Button variant="outline" className="mt-6 w-full" asChild>
                    <Link href="/assignments">View All Assignments <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    Important Events
                </CardTitle>
                <CardDescription>Don't miss these school-wide events.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto">
                    <ul className="space-y-3">
                        {highPriorityEvents.map(event => (
                            <li key={event.id} className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted">
                                <div>
                                    <p className="font-medium">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(event.date + 'T00:00:00').toLocaleDateString()}</p>
                                </div>
                                <Badge variant={getPriorityBadge(event.priority)}>{event.priority}</Badge>
                            </li>
                        ))}
                            {highPriorityEvents.length === 0 && <p className="text-sm text-muted-foreground">No high-priority events scheduled.</p>}
                    </ul>
                </div>
                 <Button variant="outline" className="mt-6 w-full" asChild>
                    <Link href="/calendar">View Full Calendar <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
