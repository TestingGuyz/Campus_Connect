'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Paperclip, Send, File as FileIcon, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useRef } from 'react';
import { useCollection } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  authorName: string;
  authorId: string;
  authorAvatarId: string;
  message: string;
  timestamp: Timestamp;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


const GroupChat = ({ groupName }: { groupName: string }) => {
  const firestore = useFirestore();
  const { user, isAuthLoading } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!firestore || !user || (newMessage.trim() === '' && !file)) return;

    setIsSending(true);

    const messagesCollection = collection(firestore, `groups/${groupName}/messages`);
    const messageData: Partial<ChatMessage> = {
      authorName: user.name,
      authorId: user.id,
      authorAvatarId: user.role === 'admin' ? 'admin-avatar' : (user.role === 'teacher' ? 'teacher-avatar-1' : 'student-avatar'),
      message: newMessage,
      timestamp: serverTimestamp(),
    };
    
    if (file) {
        try {
            const dataUrl = await fileToDataUrl(file);
            messageData.fileUrl = dataUrl;
            messageData.fileName = file.name;
            messageData.fileType = file.type;
        } catch (error) {
            console.error("Error processing file:", error);
            toast({ variant: 'destructive', title: "File Error", description: "Could not process the file for sending." });
            setIsSending(false);
            return;
        }
    }


    try {
        await addDoc(messagesCollection, messageData);
        setNewMessage('');
        setFile(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: `groups/${groupName}/messages`,
            operation: 'create',
            requestResourceData: messageData
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  
  const totalLoading = isLoading || isAuthLoading;

  if (totalLoading) {
    return <div className="p-6">Loading messages...</div>
  }

  const ChatContent = ({fileUrl, fileType, fileName, message}: Partial<ChatMessage>) => {
    if (fileUrl) {
      if (fileType?.startsWith('image/')) {
        return (
          <div className="mt-2">
            <Image src={fileUrl} alt={fileName || 'Uploaded image'} width={200} height={200} className="rounded-lg object-cover" />
            {message && <p className="mt-2 text-sm">{message}</p>}
          </div>
        );
      } else {
        return (
          <a href={fileUrl} download={fileName} className="flex items-center gap-2 mt-2 p-2 bg-background/50 rounded-lg border">
            <FileIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{fileName || 'Attached File'}</span>
          </a>
        );
      }
    }
    return <>{message}</>;
  }

  return (
    <div className="relative h-[60vh] min-h-[500px]">
      <div className="p-6 h-[calc(100%-120px)] overflow-y-auto">
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
                  <div className={`text-sm text-left text-foreground p-3 rounded-lg mt-1 inline-block ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <ChatContent {...msg} />
                  </div>
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
        {file && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg text-sm">
            <FileIcon className="h-4 w-4" />
            <span className="flex-1 truncate">{file.name}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '';}}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="relative">
          <Input 
            placeholder="Type your message..." 
            className="pr-24"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!user || isSending}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button type="submit" variant="ghost" size="icon" disabled={!user || (!newMessage.trim() && !file) || isSending}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4 text-primary" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function GroupsPage() {
    const { isAuthLoading, user } = useAuth();

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
                    <TabsTrigger value="teachers" className="py-2" disabled={!user}>Teachers</TabsTrigger>
                    <TabsTrigger value="parents" className="py-2" disabled={!user}>Parents</TabsTrigger>
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
