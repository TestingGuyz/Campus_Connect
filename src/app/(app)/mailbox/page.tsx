'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Loader2, Send, Inbox } from 'lucide-react';
import { NotAuthorized } from '@/components/not-authorized';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminMessage {
  id: string;
  studentId: string;
  studentName: string;
  message: string;
  isReply: boolean;
  timestamp: any;
}

export default function MailboxPage() {
  const { user, isAuthLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Correctly wait for auth to finish and user to be an admin before querying
  const messagesQuery = useMemoFirebase(() => {
    if (isAuthLoading || !user || user.role !== 'admin' || !firestore) {
      return null;
    }
    return query(collection(firestore, 'admin-messages'), orderBy('timestamp', 'desc'));
  }, [firestore, user, isAuthLoading]);

  const { data: allMessages, isLoading: isLoadingMessages } = useCollection<AdminMessage>(messagesQuery);
  const studentAvatar = PlaceHolderImages.find(p => p.id === 'student-avatar');
  const adminAvatar = PlaceHolderImages.find(p => p.id === 'admin-avatar');

  const studentThreads = useMemo(() => {
    if (!allMessages) return {};
    return allMessages.reduce((acc, msg) => {
      if (!acc[msg.studentId]) {
        acc[msg.studentId] = {
          studentName: msg.studentName,
          messages: [],
          lastMessageTimestamp: msg.timestamp,
        };
      }
      acc[msg.studentId].messages.push(msg);
       if (msg.timestamp > acc[msg.studentId].lastMessageTimestamp) {
        acc[msg.studentId].lastMessageTimestamp = msg.timestamp;
      }
      return acc;
    }, {} as Record<string, { studentName: string; messages: AdminMessage[], lastMessageTimestamp: any }>);
  }, [allMessages]);

  const sortedStudentIds = useMemo(() => {
      return Object.keys(studentThreads).sort((a,b) => {
          const timeA = studentThreads[a].lastMessageTimestamp?.toMillis() || 0;
          const timeB = studentThreads[b].lastMessageTimestamp?.toMillis() || 0;
          return timeB - timeA;
      });
  }, [studentThreads]);

  const selectedThreadMessages = useMemo(() => {
    if (!selectedStudentId || !studentThreads[selectedStudentId]) return [];
    return [...studentThreads[selectedStudentId].messages].sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis());
  }, [selectedStudentId, studentThreads]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('div');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [selectedStudentId, selectedThreadMessages]);

  const handleSendReply = async () => {
      if (!firestore || !user || !selectedStudentId || !replyMessage.trim()) return;
      setIsReplying(true);

      const replyData = {
          studentId: selectedStudentId,
          studentName: studentThreads[selectedStudentId].studentName,
          message: replyMessage,
          isReply: true,
          timestamp: serverTimestamp(),
      };

      try {
          await addDoc(collection(firestore, 'admin-messages'), replyData);
          toast({ title: "Reply Sent!" });
          setReplyMessage('');
      } catch (error) {
          const permissionError = new FirestorePermissionError({
              path: 'admin-messages',
              operation: 'create',
              requestResourceData: replyData
          });
          errorEmitter.emit('permission-error', permissionError);
          toast({ variant: 'destructive', title: "Failed to send reply." });
      } finally {
          setIsReplying(false);
      }
  }


  if (isAuthLoading) {
    return <Card><CardContent className="p-6 flex items-center justify-center h-[600px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> Loading mailbox...</CardContent></Card>;
  }

  if (user?.role !== 'admin') {
    return <NotAuthorized />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold">Admin Mailbox</h1>
        <p className="text-muted-foreground">Review and respond to student inquiries.</p>
      </div>

      <Card className="grid grid-cols-1 md:grid-cols-3 h-[70vh] min-h-[600px]">
        <div className="col-span-1 border-r flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-2">
              <div className="flex flex-col gap-1">
                  {isLoadingMessages && <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>}
                  {!isLoadingMessages && sortedStudentIds.map(studentId => {
                      const thread = studentThreads[studentId];
                      const lastMessage = thread.messages[0];
                      return (
                          <button
                              key={studentId}
                              onClick={() => setSelectedStudentId(studentId)}
                              className={cn(
                                'w-full text-left p-3 rounded-lg hover:bg-muted transition-colors',
                                selectedStudentId === studentId ? 'bg-muted' : ''
                              )}
                          >
                              <p className="font-semibold">{thread.studentName}</p>
                              <p className="text-sm text-muted-foreground truncate">{lastMessage.isReply ? 'You: ' : ''}{lastMessage.message}</p>
                              <p className="text-xs text-muted-foreground text-right mt-1">
                                  {lastMessage.timestamp?.toDate().toLocaleDateString()}
                              </p>
                          </button>
                      )
                  })}
                  {!isLoadingMessages && sortedStudentIds.length === 0 && <p className='p-4 text-center text-muted-foreground'>No messages yet.</p>}
              </div>
            </CardContent>
          </ScrollArea>
        </div>

        <div className="col-span-2 flex flex-col bg-muted/20">
          {selectedStudentId ? (
            <>
              <div className="border-b p-4">
                 <h3 className="text-lg font-semibold">Conversation with {studentThreads[selectedStudentId].studentName}</h3>
              </div>
              <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {selectedThreadMessages.map(msg => {
                        const isStudent = !msg.isReply;
                        return (
                             <div key={msg.id} className={`flex items-start gap-3 my-4 ${isStudent ? 'justify-start' : 'flex-row-reverse'}`}>
                                <Avatar>
                                    <AvatarImage src={isStudent ? studentAvatar?.imageUrl : adminAvatar?.imageUrl} />
                                    <AvatarFallback>{isStudent ? msg.studentName.charAt(0) : 'A'}</AvatarFallback>
                                </Avatar>
                                <div className={`w-auto max-w-[75%] flex flex-col ${isStudent ? 'items-start' : 'items-end'}`}>
                                     <div className="flex items-baseline gap-2">
                                        <p className="font-semibold text-sm">{isStudent ? msg.studentName : 'You'}</p>
                                        <p className="text-xs text-muted-foreground">{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <p className={`text-sm text-foreground bg-background shadow-sm p-3 rounded-lg mt-1 inline-block ${!isStudent ? 'bg-primary text-primary-foreground' : ''}`}>
                                        {msg.message}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-background">
                <div className="relative">
                  <Textarea
                    placeholder={`Reply to ${studentThreads[selectedStudentId].studentName}...`}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="pr-20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={handleSendReply}
                    disabled={isReplying || !replyMessage.trim()}
                  >
                    {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <Inbox className="h-16 w-16 text-muted-foreground/50"/>
              <p className="text-lg">Select a conversation to view messages.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
