'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookCheck, BookMarked, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

const upcomingClasses = [
    { time: '9:00 AM', subject: 'Mathematics', teacher: 'Mr. Davison', location: 'Room 301' },
    { time: '10:00 AM', subject: 'Physics', teacher: 'Ms. Curie', location: 'Lab A' },
    { time: '11:00 AM', subject: 'Literature', teacher: 'Mr. Poe', location: 'Room 204' },
]

const recentAssignments = [
    { title: 'Algebra II Homework', subject: 'Mathematics', due: 'Tomorrow' },
    { title: 'Lab Report: Kinematics', subject: 'Physics', due: 'In 3 days' },
    { title: 'The Raven Analysis', subject: 'Literature', due: 'In 5 days' },
]

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome back, {user?.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's your summary for today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
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
        <Card className="md:col-span-2">
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

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <BookMarked className="h-5 w-5 text-secondary" />
                Upcoming Assignments
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
            {recentAssignments.map((a, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                        <p className="font-semibold">{a.title}</p>
                        <p className="text-sm text-muted-foreground">{a.subject}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                        <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground hover:bg-secondary/30">Due: {a.due}</Badge>
                        <Button size="sm">View Details</Button>
                    </div>
                </div>
            ))}
            </div>
             <Button variant="outline" className="mt-6 w-full" asChild>
                <Link href="/assignments">View All Assignments <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
