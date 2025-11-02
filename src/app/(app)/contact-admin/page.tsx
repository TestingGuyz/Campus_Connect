'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { contactAdmin } from '@/ai/flows/contact-admin-flow';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FormSchema = z.object({
  problemDetails: z.string().min(10, {
    message: 'Please describe your problem in at least 10 characters.',
  }),
});

export default function ContactAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      problemDetails: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to contact the admin.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const result = await contactAdmin({
        problemDetails: data.problemDetails,
        studentId: user.id,
        studentName: user.name,
      });

      setSubmissionResult(result.messageToAdmin);
      toast({
        title: 'Message Sent!',
        description: 'Your message has been formatted and sent to the administrator.',
      });
      form.reset();
    } catch (error) {
      console.error('Failed to contact admin:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'There was an error sending your message. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-headline font-bold">Contact Administrator</h1>
        <p className="text-muted-foreground">
          Having an issue? Describe it below and our AI assistant will help format and send your report.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Problem Report Form</CardTitle>
          <CardDescription>
            Your name ({user?.name}) and ID ({user?.id}) will be automatically included.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="problemDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details of the problem</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="For example: 'I am unable to upload my assignment for the history class...'"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Report
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      {submissionResult && (
        <Alert>
            <AlertTitle>AI-Generated Message Sent to Admin</AlertTitle>
            <AlertDescription className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-md mt-2">
                {submissionResult}
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
