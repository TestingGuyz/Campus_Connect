'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Loader2, Send } from 'lucide-react';
import { addDoc, collection, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ScrollArea } from '@/components/ui/scroll-area';


const FormSchema = z.object({
  message: z.string().min(10, {
    message: 'Please describe your problem in at least 10 characters.',
  }),
});

interface AdminMessage {
  id: string;
  studentId: string;
  studentName: string;
  message: string;
  reply?: string;
  isReply: boolean;
  timestamp: any;
}


export default function ContactAdminPage() {
  const { user, isAuthLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { message: '' },
  });

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'admin-messages'), 
        where('studentId', '==', user.id),
        orderBy('timestamp', 'asc')
    );
  }, [firestore, user]);

  const { data: messages, isLoading: isLoadingMessages } = useCollection<AdminMessage>(messagesQuery);
  const studentAvatar = PlaceHolderImages.find(p => p.id === 'student-avatar');
  const adminAvatar = PlaceHolderImages.find(p => p.id === 'admin-avatar');

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    setIsSubmitting(true);
    const messageData = {
      studentId: user.id,
      studentName: user.name,
      message: data.message,
      isReply: false,
      timestamp: serverTimestamp(),
    };
    try {
      await addDoc(collection(firestore, 'admin-messages'), messageData);
      toast({ title: 'Message Sent!', description: 'The administrator has been notified.' });
      form.reset();
    } catch (error) {
      const permissionError = new FirestorePermissionError({
          path: 'admin-messages',
          operation: 'create',
          requestResourceData: messageData
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not send your message.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = isAuthLoading || isLoadingMessages;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-headline font-bold">Contact Administrator</h1>
        <p className="text-muted-foreground">
          Send a message to the school administration and view their replies.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Conversation</CardTitle>
          <CardDescription>This is your private message history with the admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full space-y-4 pr-4">
            {isLoading && <p>Loading messages...</p>}
            {!isLoading && messages?.map(msg => {
                const isStudent = !msg.isReply;
                return (
                    <div key={msg.id} className={`flex items-start gap-3 my-4 ${isStudent ? 'justify-start' : 'justify-end'}`}>
                        {isStudent && (
                             <Avatar>
                                <AvatarImage src={studentAvatar?.imageUrl} />
                                <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={`w-auto max-w-[75%] ${isStudent ? 'text-left' : 'text-right'}`}>
                            <div className={`flex items-baseline gap-2 ${isStudent ? 'justify-start' : 'justify-end'}`}>
                                <p className="font-semibold">{isStudent ? msg.studentName : 'Admin'}</p>
                                <p className="text-xs text-muted-foreground">{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <p className={`text-sm text-foreground bg-muted p-3 rounded-lg mt-1 inline-block ${!isStudent ? 'bg-primary text-primary-foreground' : ''}`}>
                                {msg.message}
                            </p>
                        </div>
                        {!isStudent && (
                             <Avatar>
                                <AvatarImage src={adminAvatar?.imageUrl} />
                                <AvatarFallback>A</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                )
            })}
             {!isLoading && messages?.length === 0 && (
                <div className="text-center text-muted-foreground py-12">No messages yet. Send one below to start the conversation.</div>
             )}
          </ScrollArea>
          <Separator className="my-4" />
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="For example: 'I am unable to upload my assignment for the history class...'"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" />Send Report</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
