'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

type TimetableDay = {
  period1: string; period2: string; period3: string; period4: string;
  period5: string; period6: string; period7: string; period8: string;
};
type TimetableData = {
  Monday: TimetableDay; Tuesday: TimetableDay; Wednesday: TimetableDay;
  Thursday: TimetableDay; Friday: TimetableDay;
};
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const periods: (keyof TimetableDay)[] = ["period1", "period2", "period3", "period4", "period5", "period6", "period7", "period8"];
const periodTimes = ["9:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-12:40", "12:40-1:20", "1:20-2:00", "2:00-3:00", "3:00-4:00"];

const initialTimetable: TimetableData = {
  Monday: { period1: '', period2: '', period3: '', period4: '', period5: '', period6: '', period7: '', period8: '' },
  Tuesday: { period1: '', period2: '', period3: '', period4: '', period5: '', period6: '', period7: '', period8: '' },
  Wednesday: { period1: '', period2: '', period3: '', period4: '', period5: '', period6: '', period7: '', period8: '' },
  Thursday: { period1: '', period2: '', period3: '', period4: '', period5: '', period6: '', period7: '', period8: '' },
  Friday: { period1: '', period2: '', period3: '', period4: '', period5: '', period6: '', period7: '', period8: '' },
};

const getSubjectBadgeColor = (subject: string) => {
    // A simple hash function to get a color from a list
    if (!subject) return 'bg-gray-100 text-gray-800 border-gray-200';
    const colors = [
        'bg-red-100 text-red-800 border-red-200', 'bg-blue-100 text-blue-800 border-blue-200',
        'bg-green-100 text-green-800 border-green-200', 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'bg-purple-100 text-purple-800 border-purple-200', 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'bg-pink-100 text-pink-800 border-pink-200', 'bg-teal-100 text-teal-800 border-teal-200',
    ];
    const hash = subject.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    return colors[Math.abs(hash) % colors.length];
};

function StudentTimetableView() {
    const { user, isAuthLoading } = useAuth();
    const firestore = useFirestore();
    const [timetable, setTimetable] = useState<TimetableData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTimetable = async () => {
            if (isAuthLoading || !firestore || !user || user.role !== 'student' || !user.className || !user.sectionName) {
              setIsLoading(false);
              return;
            }
            setIsLoading(true);
            try {
                const timetableDocRef = doc(firestore, `classes/${user.className}/sections/${user.sectionName}/timetable/schedule`);
                const timetableSnapshot = await getDoc(timetableDocRef);
                
                if (timetableSnapshot.exists()) {
                    setTimetable(timetableSnapshot.data() as TimetableData);
                } else {
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

    if (isLoading || isAuthLoading) {
        return <Skeleton className="h-[400px] w-full" />
    }

    if (!timetable) {
        return <Card><CardContent className="p-6 text-center text-muted-foreground">Timetable not yet available for your class.</CardContent></Card>
    }

    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[120px]">Time</TableHead>
                        {days.map(day => <TableHead key={day}>{day}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {periods.map((period, index) => (
                        <TableRow key={period}>
                            <TableCell className="font-medium">
                                {periodTimes[index]}
                                {index === 3 && <div className='text-xs text-center text-muted-foreground pt-2'>(Tiffin</div>}
                                {index === 4 && <div className='text-xs text-center text-muted-foreground pb-2'>Break)</div>}
                            </TableCell>
                            {days.map(day => (
                                <TableCell key={day}>
                                    {timetable[day as keyof TimetableData]?.[period] && (
                                        <Badge variant="outline" className={`font-semibold ${getSubjectBadgeColor(timetable[day as keyof TimetableData][period])}`}>
                                            {timetable[day as keyof TimetableData][period]}
                                        </Badge>
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function TeacherAdminTimetableView() {
    const firestore = useFirestore();
    const [classId, setClassId] = useState('10');
    const [sectionId, setSectionId] = useState('A');
    const [timetable, setTimetable] = useState<TimetableData>(initialTimetable);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchTimetable = async () => {
            if (!firestore || !classId || !sectionId) return;
            setIsLoading(true);
            try {
                const timetableDocRef = doc(firestore, `classes/${classId}/sections/${sectionId}/timetable/schedule`);
                const timetableSnapshot = await getDoc(timetableDocRef);
                if (timetableSnapshot.exists()) {
                    setTimetable(timetableSnapshot.data() as TimetableData);
                } else {
                    setTimetable(initialTimetable);
                }
            } catch (error) {
                console.error("Error fetching timetable:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTimetable();
    }, [firestore, classId, sectionId]);

    const handleInputChange = (day: keyof TimetableData, period: keyof TimetableDay, value: string) => {
        setTimetable(prev => ({
            ...prev,
            [day]: { ...prev[day], [period]: value }
        }));
    };

    const handleSave = async () => {
        if (!firestore) return;
        setIsSaving(true);
        const timetableDocRef = doc(firestore, `classes/${classId}/sections/${sectionId}/timetable/schedule`);
        try {
            await setDoc(timetableDocRef, timetable);
            toast({ title: 'Success!', description: `Timetable for Class ${classId}-${sectionId} has been saved.` });
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: timetableDocRef.path,
                operation: 'write',
                requestResourceData: timetable
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Error saving timetable', description: 'You may not have permission to perform this action.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Select Class and Section</CardTitle>
                    <CardDescription>Choose the class and section to manage the timetable for.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <label htmlFor="class-id">Class</label>
                        <Input id="class-id" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="e.g., 10" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label htmlFor="section-id">Section</label>
                        <Input id="section-id" value={sectionId} onChange={(e) => setSectionId(e.target.value)} placeholder="e.g., A" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-4 sm:mb-0">
                        <CardTitle>Edit Timetable</CardTitle>
                        <CardDescription>Fill in the subjects for each period.</CardDescription>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Timetable
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-[400px] w-full" /> : (
                        <div className="w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px] min-w-[120px]">Time</TableHead>
                                        {days.map(day => <TableHead key={day} className="min-w-[150px]">{day}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {periods.map((period, index) => (
                                        <TableRow key={period}>
                                            <TableCell className="font-medium">
                                                {periodTimes[index]}
                                                {index === 3 && <div className='text-xs text-center text-muted-foreground pt-2'>(Tiffin Break)</div>}
                                            </TableCell>
                                            {days.map(day => (
                                                <TableCell key={day}>
                                                    {index === 3 || index === 4 ? (
                                                        <Badge variant="outline" className="font-semibold bg-gray-200 text-gray-800 border-gray-300">
                                                            {index === 3 ? 'Tiffin' : 'Break'}
                                                        </Badge>
                                                    ) : (
                                                        <Input
                                                            value={timetable[day as keyof TimetableData]?.[period] || ''}
                                                            onChange={(e) => handleInputChange(day as keyof TimetableData, period, e.target.value)}
                                                            className="h-8"
                                                        />
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function TimetablePage() {
    const { user, isAuthLoading } = useAuth();
    
    if (isAuthLoading) {
        return <Skeleton className="h-screen w-full" />;
    }

    const canManageTimetable = user?.role === 'admin' || user?.role === 'teacher';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-headline font-bold">Weekly Timetable</h1>
                <p className="text-muted-foreground">
                    {canManageTimetable ? 'Manage class schedules.' : (user ? `Class schedule for Grade ${user.className} - Section ${user.sectionName}.` : 'Your weekly class schedule.')}
                </p>
            </div>
            {canManageTimetable ? <TeacherAdminTimetableView /> : <StudentTimetableView />}
        </div>
    );
}
