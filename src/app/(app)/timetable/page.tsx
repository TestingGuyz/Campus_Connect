import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const timetable = {
  "9:00 - 10:00": { Monday: "Mathematics", Tuesday: "Physics", Wednesday: "Mathematics", Thursday: "Physics", Friday: "Literature" },
  "10:00 - 11:00": { Monday: "Physics", Tuesday: "History", Wednesday: "Physics", Thursday: "Literature", Friday: "Mathematics" },
  "11:00 - 12:00": { Monday: "Literature", Tuesday: "Mathematics", Wednesday: "History", Thursday: "Mathematics", Friday: "Physics" },
  "12:00 - 1:00": { Monday: "Lunch", Tuesday: "Lunch", Wednesday: "Lunch", Thursday: "Lunch", Friday: "Lunch" },
  "1:00 - 2:00": { Monday: "History", Tuesday: "Literature", Wednesday: "Assembly", Thursday: "History", Friday: "Sports" },
  "2:00 - 3:00": { Monday: "Lab", Tuesday: "Lab", Wednesday: "Library", Thursday: "Lab", Friday: "Sports" },
};

const timeSlots = Object.keys(timetable);
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const getSubjectBadgeColor = (subject: string) => {
    switch(subject.toLowerCase()){
        case 'mathematics': return 'bg-red-200 text-red-800 border-red-300';
        case 'physics': return 'bg-blue-200 text-blue-800 border-blue-300';
        case 'literature': return 'bg-green-200 text-green-800 border-green-300';
        case 'history': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
        case 'sports': return 'bg-purple-200 text-purple-800 border-purple-300';
        case 'lab': return 'bg-indigo-200 text-indigo-800 border-indigo-300';
        case 'lunch': return 'bg-gray-200 text-gray-800 border-gray-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

export default function TimetablePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold">Weekly Timetable</h1>
        <p className="text-muted-foreground">Here is your class schedule for the week.</p>
      </div>
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
                      {timetable[time as keyof typeof timetable][day as keyof typeof timetable[keyof typeof timetable]] && (
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
    </div>
  );
}
