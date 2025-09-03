'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

// Create browser client for client-side operations
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured) {
        // Mock authentication - simulate successful login
        console.log('Mock login successful for:', values.email);
        // Use window.location.href for full page reload to ensure middleware gets updated session
        window.location.href = redirectTo;
        return;
      }

      const response = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (response.error) {
        console.error('Login error:', response.error.message);
        // You can replace this with a toast notification later
        alert(`Login failed: ${response.error.message}`);
      } else if (response.data) {
        console.log('Login successful:', response.data.user);
        // Use window.location.href for full page reload to ensure middleware gets updated session
        window.location.href = redirectTo;
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your email and password to access your account
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            ℹ️ Running in demo mode. You can use any email and password to sign in.
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your password"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Form>
    </div>
  );
}