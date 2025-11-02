'use client'

import { Activity, BookOpen, Check, Users, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

const chartData = [
  { month: "January", attendance: 186, assignments: 80 },
  { month: "February", attendance: 305, assignments: 200 },
  { month: "March", attendance: 237, assignments: 120 },
  { month: "April", attendance: 73, assignments: 190 },
  { month: "May", attendance: 209, assignments: 130 },
  { month: "June", attendance: 214, assignments: 140 },
];

const chartConfig = {
  attendance: {
    label: "Attendance",
    color: "hsl(var(--primary))",
  },
  assignments: {
    label: "Assignments",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

const recentActivities = [
    { student: 'Liam Johnson', activity: 'Submitted "History Essay"', time: '5m ago' },
    { student: 'Olivia Smith', activity: 'Joined "Science Club"', time: '10m ago' },
    { student: 'Noah Williams', activity: 'Marked as present', time: '1h ago' },
    { student: 'Emma Brown', activity: 'Downloaded "Algebra Cheatsheet"', time: '2h ago' },
    { student: 'Ava Jones', activity: 'Submitted "Art Project"', time: '3h ago' },
]

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

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { user } = useUser();

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'events');
  }, [firestore, user]);
  const { data: events, isLoading: isLoadingEvents } = useCollection<SchoolEvent>(eventsQuery);

  const highPriorityEvents = events?.filter(e => e.priority === 'High' && new Date(e.date) >= new Date())
                                   .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                   .slice(0, 5) || [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-headline font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assignments Graded
            </CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{events?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              in total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
                Active Staff
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52</div>
            <p className="text-xs text-muted-foreground">
              Online now
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                 <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                 <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="attendance" fill="var(--color-attendance)" radius={4} />
                <Bar dataKey="assignments" fill="var(--color-assignments)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <div className="lg:col-span-3 grid gap-6">
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarCheck className="text-destructive"/> High-Priority Events</CardTitle>
                <CardDescription>Urgent upcoming events and deadlines.</CardDescription>
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
                         {highPriorityEvents.length === 0 && <p className="text-sm text-muted-foreground">No high-priority events found.</p>}
                    </ul>
                )}
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                        {recentActivities.map((activity, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <div className="font-medium">{activity.student}</div>
                                    <div className="hidden text-sm text-muted-foreground md:inline">
                                        {activity.activity}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{activity.time}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
