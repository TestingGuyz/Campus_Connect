'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

type SchoolEvent = {
  id: string;
  date: string; // Storing date as ISO string
  title: string;
  type: 'meeting' | 'event' | 'academic' | 'holiday' | 'other';
  priority: 'High' | 'Medium' | 'Low';
};

const getEventTypeBadge = (type: string) => {
  switch (type) {
    case 'meeting': return 'default';
    case 'event': return 'secondary';
    case 'academic': return 'destructive';
    case 'holiday': return 'outline';
    default: return 'outline';
  }
};

const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
}

function AddEventModal({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState<'meeting' | 'event' | 'academic' | 'holiday' | 'other'>('other');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddEvent = async () => {
        if (!firestore || !title || !date) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a title and date.' });
            return;
        }
        setIsSubmitting(true);
        const eventData = {
            title,
            date,
            type,
            priority,
            createdAt: serverTimestamp(),
        };
        try {
            await addDoc(collection(firestore, 'events'), eventData);
            toast({ title: 'Success', description: 'Event added to the calendar.' });
            setIsOpen(false);
            setTitle(''); setDate(''); setType('other'); setPriority('Medium');
        } catch (error) {
            console.error('Error adding event: ', error);
            const permissionError = new FirestorePermissionError({
                path: 'events',
                operation: 'create',
                requestResourceData: eventData
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add event.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Calendar Event</DialogTitle>
                    <DialogDescription>Fill in the details below to add a new event to the school calendar.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="event-title">Event Title</Label>
                        <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Science Fair" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="event-date">Date</Label>
                        <Input id="event-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="event-type">Type</Label>
                            <Select onValueChange={(v) => setType(v as any)} defaultValue="other">
                                <SelectTrigger id="event-type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="meeting">Meeting</SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                    <SelectItem value="academic">Academic</SelectItem>
                                    <SelectItem value="holiday">Holiday</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event-priority">Priority</Label>
                            <Select onValueChange={(v) => setPriority(v as any)} defaultValue="Medium">
                                <SelectTrigger id="event-priority">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleAddEvent} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Event
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function CalendarPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const firestore = useFirestore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const eventsQuery = useMemoFirebase(() => {
    // CRITICAL: Wait for auth to be loaded and user to be present.
    if (isAuthLoading || !user || !firestore) return null;
    return collection(firestore, 'events');
  }, [firestore, user, isAuthLoading]);
  
  const { data: events, isLoading: isLoadingEvents } = useCollection<SchoolEvent>(eventsQuery);

  const sortedEvents = events?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcomingEvents = sortedEvents?.filter(e => new Date(e.date) >= new Date()) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Calendar</h1>
          <p className="text-muted-foreground">View and manage school events and schedules.</p>
        </div>
        {user?.role === 'admin' && (
          <>
            <Button className="mt-4 sm:mt-0" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Event
            </Button>
            <AddEventModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="w-full"
              modifiers={{
                event: (events || []).map(e => new Date(e.date + 'T00:00:00')) // Make sure to handle timezone correctly
              }}
              modifiersClassNames={{
                event: 'bg-primary/20 rounded-full'
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>A list of important dates and events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingEvents && <p>Loading events...</p>}
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center bg-muted text-muted-foreground rounded-md h-12 w-12 shrink-0">
                    <span className="text-xs font-bold uppercase">{new Date(event.date + 'T00:00:00').toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-lg font-bold">{new Date(event.date + 'T00:00:00').getDate()}</span>
                </div>
                <div>
                  <p className="font-medium">{event.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={getEventTypeBadge(event.type)}>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</Badge>
                    <Badge variant={getPriorityBadge(event.priority)}>{event.priority}</Badge>
                  </div>
                </div>
              </div>
            ))}
            {upcomingEvents.length === 0 && !isLoadingEvents && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
