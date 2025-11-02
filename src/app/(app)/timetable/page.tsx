'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type TimetableData = {
  [time: string]: {
    [day: string]: string;
  };
};

const getSubjectBadgeColor = (subject: string) => {
    switch(subject.toLowerCase()){
        case 'mathematics': return 'bg-red-200 text-red-800 border-red-300';
        case 'physics': return 'bg-blue-200 text-blue-800 border-blue-300';
        case 'literature': return 'bg-green-200 text-green-800 border-green-300';
        case 'history': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
        case 'sports': return 'bg-purple-200 text-purple-800 border-purple-300';
        case 'lab': return 'bg-indigo-200 text-indigo-800 border-indigo-300';
        case 'lunch': return 'bg-gray-200 text-gray-800 border-gray-300';
        case 'art': return 'bg-pink-200 text-pink-800 border-pink-300';
        case 'music': return 'bg-teal-200 text-teal-800 border-teal-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

const LoadingSkeleton = () => (
    <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]"><Skeleton className="h-6 w-24" /></TableHead>
                {Array.from({ length: 5 }).map((_, i) => <TableHead key={i}><Skeleton className="h-6 w-24" /></TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
);

export default function TimetablePage() {
    const { user, isAuthLoading } = useAuth();
    const firestore = useFirestore();
    const [timetable, setTimetable] = useState<TimetableData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTimetable = async () => {
            if (isAuthLoading || !firestore || !user) {
                setIsLoading(true);
                return;
            };
            if (user.role !== 'student' || !user.className || !user.sectionName) {
                setIsLoading(false);
                return;
            }

            try {
                const timetableCollectionRef = collection(firestore, `classes/${user.className}/sections/${user.sectionName}/timetable`);
                const timetableSnapshot = await getDocs(timetableCollectionRef);
                
                if (!timetableSnapshot.empty) {
                    const timetableDoc = timetableSnapshot.docs[0]; // Assuming one timetable doc per section
                    setTimetable(timetableDoc.data() as TimetableData);
                } else {
                    console.log("No timetable found for this section.");
                    setTimetable(null);
                }
            } catch (error) {
                console.error("Error fetching timetable:", error);
                setTimetable(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTimetable();
    }, [user, firestore, isAuthLoading]);

  const timeSlots = timetable ? Object.keys(timetable).sort() : [];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold">Weekly Timetable</h1>
        <p className="text-muted-foreground">
            {user?.role === 'student' 
                ? `Class schedule for Grade ${user.className} - Section ${user.sectionName}.`
                : 'Your weekly class schedule.'}
        </p>
      </div>

      {isLoading ? <LoadingSkeleton /> : timetable ? (
        <Card>
            <CardContent className="pt-6">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[150px]">Time</TableHead>
                    {days.map(day => <TableHead key={day}>{day}</TableHead>)}
                </TableRow>
                </TableHeader>
                <TableBody>
                {timeSlots.map(time => (
                    <TableRow key={time}>
                    <TableCell className="font-medium">{time}</TableCell>
                    {days.map(day => (
                        <TableCell key={day}>
                        {timetable[time as keyof typeof timetable]?.[day as keyof typeof timetable[keyof typeof timetable]] && (
                            <Badge variant="outline" className={`font-semibold ${getSubjectBadgeColor(timetable[time as keyof typeof timetable][day as keyof typeof timetable[keyof typeof timetable]])}`}>
                                {timetable[time as keyof typeof timetable][day as keyof typeof timetable[keyof typeof timetable]]}
                            </Badge>
                        )}
                        </TableCell>
                    ))}
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      ) : (
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No timetable available for your class and section.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
