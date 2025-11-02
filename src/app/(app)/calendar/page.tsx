'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const events = [
  { date: new Date(2024, 6, 8), title: 'Parent-Teacher Conference', type: 'meeting' },
  { date: new Date(2024, 6, 15), title: 'Science Fair', type: 'event' },
  { date: new Date(2024, 6, 22), title: 'Mid-term Exams Begin', type: 'academic' },
  { date: new Date(2024, 6, 29), title: 'School Holiday - National Day', type: 'holiday' },
];

export default function CalendarPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'default';
      case 'event':
        return 'secondary';
      case 'academic':
        return 'destructive';
      case 'holiday':
        return 'outline';
      default:
        return 'outline';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Calendar</h1>
          <p className="text-muted-foreground">View and manage school events and schedules.</p>
        </div>
        {user?.role === 'admin' && (
          <Button className="mt-4 sm:mt-0">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Event
          </Button>
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
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>A list of important dates and events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {events.map((event, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center bg-muted text-muted-foreground rounded-md h-12 w-12 shrink-0">
                    <span className="text-xs font-bold uppercase">{event.date.toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-lg font-bold">{event.date.getDate()}</span>
                </div>
                <div>
                  <p className="font-medium">{event.title}</p>
                  <Badge variant={getEventTypeBadge(event.type)}>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
