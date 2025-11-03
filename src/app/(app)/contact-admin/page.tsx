'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Wand2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { contactAdmin } from '@/ai/flows/contact-admin-flow';


const FormSchema = z.object({
  problemDetails: z.string().min(10, {
    message: 'Please describe your problem in at least 10 characters.',
  }),
   message: z.string().min(10, {
    message: 'Message must be at least 10 characters.',
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { 
      problemDetails: '',
      message: '' 
    },
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

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
        // A bit of a hack, but it works to scroll to the very bottom
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('div');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);


  async function handleGenerateMessage() {
    if (!user) return;
    const problemDetails = form.getValues('problemDetails');
    if (!problemDetails || problemDetails.length < 10) {
      form.setError('problemDetails', { type: 'manual', message: 'Please describe your problem in at least 10 characters.' });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await contactAdmin({
        problemDetails: problemDetails,
        studentId: user.id,
        studentName: user.name,
      });
      if (result?.messageToAdmin) {
        form.setValue('message', result.messageToAdmin);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not generate message. Please try again.' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'An error occurred while generating the message.' });
    } finally {
      setIsGenerating(false);
    }
  }

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
      form.reset({problemDetails: '', message: ''});
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
        <h1 className="text-2xl font-bold font-headline">Contact Administrator</h1>
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
          <ScrollArea className="h-[300px] w-full space-y-4 pr-4" ref={scrollAreaRef}>
            {isLoading && <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>}
            {!isLoading && messages?.map(msg => {
                const isStudent = !msg.isReply;
                return (
                    <div key={msg.id} className={`flex items-start gap-3 my-4 ${isStudent ? 'justify-start' : 'flex-row-reverse'}`}>
                        <Avatar>
                            <AvatarImage src={isStudent ? studentAvatar?.imageUrl : adminAvatar?.imageUrl} />
                            <AvatarFallback>{isStudent ? user?.name.charAt(0) : 'A'}</AvatarFallback>
                        </Avatar>

                        <div className={`w-auto max-w-[75%] flex flex-col ${isStudent ? 'items-start' : 'items-end'}`}>
                             <div className="flex items-baseline gap-2">
                                <p className="font-semibold text-sm">{isStudent ? 'You' : 'Admin'}</p>
                                <p className="text-xs text-muted-foreground">{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <p className={`text-sm p-3 rounded-lg mt-1 inline-block ${!isStudent ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {msg.message}
                            </p>
                        </div>
                    </div>
                )
            })}
             {!isLoading && messages?.length === 0 && (
                <div className="text-center text-muted-foreground py-12">No messages yet. Send one below to start the conversation.</div>
             )}
          </ScrollArea>
          <Separator className="my-4" />
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormField
                control={form.control}
                name="problemDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1. Describe your issue (for AI)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="For example: 'I am unable to upload my assignment for the history class...'"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Let our AI assistant help you draft a clear message to the admin.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <Button type="button" onClick={handleGenerateMessage} disabled={isGenerating} variant="outline" size="sm">
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                ) : (
                  <><Wand2 className="mr-2 h-4 w-4" />Generate Message with AI</>
                )}
              </Button>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2. Your Message to the Admin</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Your generated or manually typed message will appear here."
                        className="min-h-[120px] bg-muted/40"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting || !form.formState.isValid || !form.getValues('message')} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" />Send Message</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
