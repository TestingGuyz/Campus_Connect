'use client'

import { Activity, BookOpen, Users, CalendarCheck, BarChart2 } from 'lucide-react';
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, getDocs, query } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';

const chartConfig = {
  present: {
    label: "Present",
    color: "hsl(var(--chart-2))",
  },
  absent: {
    label: "Absent",
    color: "hsl(var(--chart-1))",
  },
  late: {
    label: "Late",
    color: "hsl(var(--chart-4))",
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

type AttendanceRecord = {
  id: string; // date YYYY-MM-DD
  [classSectionKey: string]: Record<string, 'present' | 'absent' | 'late'>;
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
  const { user, isAuthLoading } = useAuth();
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [attendanceChartData, setAttendanceChartData] = useState<any[]>([]);

  const eventsQuery = useMemoFirebase(() => {
    if (isAuthLoading || !user || !firestore) return null;
    return query(collection(firestore, 'events'));
  }, [firestore, user, isAuthLoading]);

  const attendanceQuery = useMemoFirebase(() => {
    if (isAuthLoading || !user || !firestore) return null;
    return query(collection(firestore, 'attendance'));
  }, [firestore, user, isAuthLoading]);

  const { data: events, isLoading: isLoadingEvents } = useCollection<SchoolEvent>(eventsQuery);
  const { data: attendanceData, isLoading: isLoadingAttendance } = useCollection<AttendanceRecord>(attendanceQuery);
  
  useEffect(() => {
    const fetchCounts = async () => {
        if (!firestore) return;

        try {
            const teachersSnapshot = await getDocs(collection(firestore, 'teachers'));
            setTeacherCount(teachersSnapshot.size);

            const studentsSnapshot = await getDocs(collectionGroup(firestore, 'students'));
            setStudentCount(studentsSnapshot.size);
        } catch (e) {
            console.error("Error fetching counts: ", e);
        }
    };
    if (firestore) {
      fetchCounts();
    }
  }, [firestore]);

  useEffect(() => {
    if (attendanceData) {
      const today = new Date();
      const last5Days = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const chartData = last5Days.map(date => {
        const recordForDay = attendanceData.find(a => a.id === date);
        const dayStats = {
          date: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          present: 0,
          absent: 0,
          late: 0,
        };

        if (recordForDay) {
          // Iterate over all class sections for that day (e.g., '10-A', '10-B')
          Object.keys(recordForDay).forEach(key => {
            if (key !== 'id') {
              const classAttendance = recordForDay[key];
              Object.values(classAttendance).forEach(status => {
                if (status === 'present') dayStats.present++;
                else if (status === 'absent') dayStats.absent++;
                else if (status === 'late') dayStats.late++;
              });
            }
          });
        }
        return dayStats;
      });
      setAttendanceChartData(chartData);
    }
  }, [attendanceData]);


  const isLoading = isAuthLoading || isLoadingEvents || isLoadingAttendance;
  
  const highPriorityEvents = events?.filter(e => e.priority === 'High' && new Date(e.date) >= new Date())
                                   .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                   .slice(0, 5) || [];
  
  const totalAttendance = attendanceChartData[attendanceChartData.length - 1];
  const attendanceRate = totalAttendance && (totalAttendance.present + totalAttendance.late) > 0 ? (((totalAttendance.present + totalAttendance.late) / (totalAttendance.present + totalAttendance.late + totalAttendance.absent)) * 100).toFixed(1) : 'N/A';

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : studentCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all classes
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
            <div className="text-2xl font-bold">{isLoading ? '...' : teacherCount}</div>
            <p className="text-xs text-muted-foreground">
              Total teachers
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
            <div className="text-2xl font-bold">+{isLoading ? '...' : (events?.length || 0)}</div>
            <p className="text-xs text-muted-foreground">
              in total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
                Today's Attendance
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : `${attendanceRate}%`}</div>
            <p className="text-xs text-muted-foreground">
              Based on latest records
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>A summary of student attendance over the past 5 days.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={attendanceChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                 <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                 <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="present" stackId="a" fill="var(--color-present)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="absent" stackId="a" fill="var(--color-absent)" radius={[0, 0, 0, 0]} />
                 <Bar dataKey="late" stackId="a" fill="var(--color-late)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <div className="lg:col-span-3 grid grid-cols-1 gap-6 auto-rows-max">
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarCheck className="text-destructive"/> High-Priority Events</CardTitle>
                <CardDescription>Urgent upcoming events and deadlines.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <p>Loading events...</p> : (
                    <div className="w-full overflow-x-auto">
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
                    </div>
                )}
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>A log of recent student and staff actions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableBody>
                            {recentActivities.map((activity, index) => (
                                <TableRow key={index}>
                                    <TableCell className='p-2'>
                                        <div className="font-medium">{activity.student}</div>
                                        <div className="hidden text-sm text-muted-foreground md:inline">
                                            {activity.activity}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right p-2">{activity.time}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
