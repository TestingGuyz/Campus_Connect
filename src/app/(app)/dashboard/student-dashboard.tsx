'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookMarked, CalendarCheck, TrendingUp, CalendarDays, Clock } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

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
const periodTimes: { start: string; end: string; name: keyof TimetableDay }[] = [
    { name: 'period1', start: '09:00', end: '10:00' },
    { name: 'period2', start: '10:00', end: '11:00' },
    { name: 'period3', start: '11:00', end: '12:00' },
    { name: 'period4', start: '12:00', end: '12:40' },
    { name: 'period5', start: '12:40', end: '13:20' },
    { name: 'period6', start: '13:20', end: '14:00' },
    { name: 'period7', start: '14:00', end: '15:00' },
    { name: 'period8', start: '15:00', end: '16:00' },
];
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


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
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  const assignmentsQuery = useMemoFirebase(() => {
        if (isAuthLoading || !user?.className || !user?.sectionName || !firestore) return null;
        return query(
            collection(firestore, 'assignments'), 
            where('classId', '==', user.className),
            where('sectionId', '==', user.sectionName)
        );
    }, [firestore, user, isAuthLoading]);
  const { data: assignments, isLoading: isLoadingAssignments } = useCollection<Assignment>(assignmentsQuery);
  
  const eventsQuery = useMemoFirebase(() => {
    if (isAuthLoading || !user || !firestore) return null;
    return collection(firestore, 'events');
  }, [firestore, user, isAuthLoading]);
  const { data: events, isLoading: isLoadingEvents } = useCollection<SchoolEvent>(eventsQuery);

  const timetableDocRef = useMemoFirebase(() => {
      if (isAuthLoading || !user?.className || !user?.sectionName || !firestore) return null;
      return doc(firestore, `classes/${user.className}/sections/${user.sectionName}/timetable/schedule`);
  }, [firestore, user, isAuthLoading]);
  const { data: timetable, isLoading: isLoadingTimetable } = useDoc<TimetableData>(timetableDocRef);

  const isLoading = isAuthLoading || isLoadingAssignments || isLoadingEvents || isLoadingTimetable;
  
  const upcomingAssignments = assignments
    ?.filter(a => new Date(a.dueDate) >= new Date())
    .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3) || [];
  
  const highPriorityEvents = events?.filter(e => e.priority === 'High' && new Date(e.date) >= new Date())
                                   .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                   .slice(0, 3) || [];

    const getTodaySchedule = () => {
        if (!timetable) return [];
        const todayDayName = daysOfWeek[now.getDay()] as keyof TimetableData;
        if (!timetable[todayDayName]) return [];

        const todaySchedule = timetable[todayDayName];
        return periodTimes.map(period => {
            const subject = todaySchedule[period.name];
            if (!subject || subject.toLowerCase() === 'break' || subject.toLowerCase() === 'tiffin') return null;

            const [startHour, startMinute] = period.start.split(':').map(Number);
            const [endHour, endMinute] = period.end.split(':').map(Number);
            const startTime = new Date(now);
            startTime.setHours(startHour, startMinute, 0, 0);
            const endTime = new Date(now);
            endTime.setHours(endHour, endMinute, 0, 0);

            let status = 'Upcoming';
            if (now >= startTime && now < endTime) {
                status = 'In Progress';
            } else if (now >= endTime) {
                status = 'Finished';
            }
            
            return {
                time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                subject: subject,
                status: status,
            };
        }).filter(item => item && item.status !== 'Finished');
    };

    const todaySchedule = getTodaySchedule();

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
            {isLoadingTimetable ? <p>Loading schedule...</p> : (
                 <div className="space-y-4">
                    {todaySchedule.length > 0 ? todaySchedule.map((c, i) => (
                        <div key={i} className="flex items-center">
                            <div className="flex flex-col h-10 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary mr-4">
                                <span className="font-bold text-sm">{c.time.split(' ')[0]}</span>
                                <span className="text-xs">{c.time.split(' ')[1]}</span>
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold">{c.subject}</p>
                            </div>
                            <Badge variant={c.status === 'In Progress' ? "default" : "secondary"}>
                                {c.status}
                            </Badge>
                        </div>
                    )) : <p className="text-sm text-muted-foreground text-center py-8">No more classes for today. Great work!</p>}
                </div>
            )}
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
