import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Paperclip, Send } from 'lucide-react';

const teachersGroup = [
  { name: 'Dr. Evelyn Reed', message: 'Reminder: Staff meeting tomorrow at 9 AM in the main conference room.', time: '10:32 AM', avatarId: 'admin-avatar' },
  { name: 'Mr. Davison', message: 'I have uploaded the new curriculum guidelines for Mathematics. Please review.', time: '11:15 AM', avatarId: 'teacher-avatar-1'},
  { name: 'Ms. Curie', message: 'Could someone cover my physics lab session this Friday? I have a family emergency.', time: '1:20 PM', avatarId: 'teacher-avatar-2' },
];

const parentsGroup = [
  { name: 'Mr. Johnson (Alex\'s Dad)', message: 'Is the science fair project deadline extended?', time: '9:05 AM', avatarId: 'parent-avatar-1' },
  { name: 'Mrs. Garcia (Maria\'s Mom)', message: 'Thank you for the quick update on the school trip. Much appreciated!', time: '2:40 PM', avatarId: 'parent-avatar-2' },
];

const GroupChat = ({ messages }: { messages: typeof teachersGroup }) => (
  <div className="space-y-4">
    {messages.map((msg, index) => {
      const avatar = PlaceHolderImages.find(img => img.id === msg.avatarId);
      return (
        <div key={index} className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={avatar?.imageUrl} data-ai-hint={avatar?.imageHint}/>
            <AvatarFallback>{msg.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="w-full">
            <div className="flex items-baseline justify-between">
                <p className="font-semibold">{msg.name}</p>
                <p className="text-xs text-muted-foreground">{msg.time}</p>
            </div>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg mt-1">{msg.message}</p>
          </div>
        </div>
      )
    })}
  </div>
);

export default function GroupsPage() {
  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-headline font-bold">Interactive Groups</h1>
          <p className="text-muted-foreground">Communicate with teachers and parents in dedicated groups.</p>
        </div>
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="teachers" className="w-full">
            <div className="border-b">
                <TabsList className="grid w-full grid-cols-2 bg-muted/40 h-auto rounded-none p-2">
                    <TabsTrigger value="teachers" className="py-2">Teachers</TabsTrigger>
                    <TabsTrigger value="parents" className="py-2">Parents</TabsTrigger>
                </TabsList>
            </div>
            <div className="relative">
                <div className="p-6 h-[500px] overflow-y-auto">
                    <TabsContent value="teachers">
                        <GroupChat messages={teachersGroup} />
                    </TabsContent>
                    <TabsContent value="parents">
                        <GroupChat messages={parentsGroup} />
                    </TabsContent>
                </div>
                <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
                    <div className="relative">
                        <Input placeholder="Type your message..." className="pr-24" />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                            <Button variant="ghost" size="icon">
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Send className="h-4 w-4 text-primary" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
