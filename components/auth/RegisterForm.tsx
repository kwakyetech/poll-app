'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }).max(50, {
    message: 'Username must be less than 50 characters.',
  }).regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores.',
  }),
  firstname: z.string().min(1, {
    message: 'First name is required.',
  }).max(100, {
    message: 'First name must be less than 100 characters.',
  }),
  lastname: z.string().min(1, {
    message: 'Last name is required.',
  }).max(100, {
    message: 'Last name must be less than 100 characters.',
  }),
  middlename: z.string().max(100, {
    message: 'Middle name must be less than 100 characters.',
  }).optional(),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  confirmPassword: z.string().min(6, {
    message: 'Password confirmation must be at least 6 characters.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      firstname: '',
      lastname: '',
      middlename: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      // Mock registration - simulate successful account creation
      console.log('Mock registration successful for:', values.username, values.email);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSuccess(true);
      
      // Redirect to login after success
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-green-600">Account Created!</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your account has been created successfully. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Create your account</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
          Enter your details to create a new account
        </p>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs sm:text-sm text-blue-800">
          ℹ️ Running in demo mode. Account creation is simulated.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your username"
                    type="text"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs sm:text-sm" />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField
              control={form.control}
              name="firstname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">First Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your first name"
                      type="text"
                      className="h-10 sm:h-11 text-sm sm:text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Last Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your last name"
                      type="text"
                      className="h-10 sm:h-11 text-sm sm:text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="middlename"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">Middle Name (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your middle name"
                    type="text"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs sm:text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs sm:text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your password"
                    type="password"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs sm:text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Confirm your password"
                    type="password"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs sm:text-sm" />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base mt-4 sm:mt-6" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </Form>
    </div>
  );
}