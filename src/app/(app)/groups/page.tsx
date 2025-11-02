'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Paperclip, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useRef } from 'react';
import { useCollection } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface ChatMessage {
  id: string;
  authorName: string;
  authorId: string;
  authorAvatarId: string;
  message: string;
  timestamp: Timestamp;
}

const GroupChat = ({ groupName }: { groupName: string }) => {
  const firestore = useFirestore();
  const { user, isAuthLoading } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(
    () => {
      if (isAuthLoading || !user || !firestore) return null;
      return query(collection(firestore, `groups/${groupName}/messages`), orderBy('timestamp', 'asc'))
    },
    [firestore, groupName, user, isAuthLoading]
  );
  const { data: messages, isLoading } = useCollection<ChatMessage>(messagesQuery);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || newMessage.trim() === '') return;

    const messagesCollection = collection(firestore, `groups/${groupName}/messages`);
    const messageData = {
      authorName: user.name,
      authorId: user.id,
      authorAvatarId: user.role === 'admin' ? 'admin-avatar' : (user.role === 'teacher' ? 'teacher-avatar-1' : 'student-avatar'),
      message: newMessage,
      timestamp: serverTimestamp(),
    };

    try {
        await addDoc(messagesCollection, messageData);
        setNewMessage('');
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: `groups/${groupName}/messages`,
            operation: 'create',
            requestResourceData: messageData
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };
  
  const totalLoading = isLoading || isAuthLoading;

  if (totalLoading) {
    return <div className="p-6">Loading messages...</div>
  }

  return (
    <div className="relative h-[500px]">
      <div className="p-6 h-[calc(500px-76px)] overflow-y-auto">
        <div className="space-y-4">
          {messages?.map((msg) => {
            const avatar = PlaceHolderImages.find(img => img.id === msg.authorAvatarId);
            const isCurrentUser = msg.authorId === user?.id;
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                 {!isCurrentUser && (
                    <Avatar>
                        <AvatarImage src={avatar?.imageUrl} data-ai-hint={avatar?.imageHint}/>
                        <AvatarFallback>{msg.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                 )}
                <div className={`w-auto max-w-[75%] ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-baseline gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    {!isCurrentUser && <p className="font-semibold">{msg.authorName}</p>}
                    <p className="text-xs text-muted-foreground">{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <p className={`text-sm text-foreground bg-muted p-3 rounded-lg mt-1 inline-block ${isCurrentUser ? 'bg-primary text-primary-foreground' : ''}`}>
                    {msg.message}
                  </p>
                </div>
                 {isCurrentUser && (
                    <Avatar>
                        <AvatarImage src={avatar?.imageUrl} data-ai-hint={avatar?.imageHint}/>
                        <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                 )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
        <form onSubmit={handleSendMessage} className="relative">
          <Input 
            placeholder="Type your message..." 
            className="pr-24"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!user}
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button type="submit" variant="ghost" size="icon" disabled={!user || !newMessage.trim()}>
              <Send className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function GroupsPage() {
    const { isAuthLoading } = useAuth();

    if(isAuthLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Interactive Groups</h1>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
                <Card><CardContent className="p-6">Loading groups...</CardContent></Card>
            </div>
        );
    }

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
            <TabsContent value="teachers">
                <GroupChat groupName="teachers" />
            </TabsContent>
            <TabsContent value="parents">
                <GroupChat groupName="parents" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
