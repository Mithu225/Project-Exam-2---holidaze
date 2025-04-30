'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

type UserRole = 'Guest' | 'venueManager';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  bio: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;



export default function RegisterForm() {
  const [role, setRole] = useState<UserRole>('Guest');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  

  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      bio: '',
      
    },
  });
  
  const router = useRouter();

  const onSubmit = async (values: FormValues) => {
    setError('');
    setIsLoading(true);
    
    try {
      
      const requestBody = { 
        name: values.name,
        email: values.email, 
        password: values.password
      } as any; 
      
    
      if (role === 'venueManager') {
        requestBody.venueManager = true;
      }
      
  
      if (values.bio && values.bio.trim() !== '') {
        requestBody.bio = values.bio.trim();
      }

      const response = await fetch('https://v2.api.noroff.dev/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Request payload:', JSON.stringify(requestBody, null, 2));
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration error:', errorData);
        console.error('Status code:', response.status);
        console.error('Full request body:', JSON.stringify(requestBody, null, 2));
        
        let errorMessage = 'Registration failed';
        
        if (errorData.errors && errorData.errors.length > 0) {
         
          console.error('Detailed errors:', errorData.errors);
          errorMessage = errorData.errors.map((err: any) => 
            typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err)
          ).join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }
      
      const { data } = await response.json();
      
      console.log(`Successfully registered as ${data.name}`);
      
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto bg-white p-8 sm:p-10 rounded-lg shadow-md">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-custom-blue">Create an account</h1>
        <p className="text-custom-gray">Sign up to get started with Holidaze</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md border border-red-200">
          <p className="font-semibold mb-1">Registration Error:</p>
          <p>{error}</p>
          {error.includes('URL') && (
            <p className="mt-2 text-xs">Note: We've removed the avatar field to avoid URL validation issues. Please try again without any avatar URL.</p>
          )}
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              I am a:
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Guest"
                  checked={role === 'Guest'}
                  onChange={() => setRole('Guest')}
                  className="h-4 w-4 text-custom-blue focus:ring-custom-blue"
                />
                <span className="ml-2 text-sm text-gray-700">Traveler</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="venueManager"
                  checked={role === 'venueManager'}
                  onChange={() => setRole('venueManager')}
                  className="h-4 w-4 text-custom-blue focus:ring-custom-blue"
                />
                <span className="ml-2 text-sm text-gray-700">Venue Manager</span>
              </label>
            </div>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your.email@stud.noroff.no" {...field} />
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
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Tell us about yourself" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        

          <div className="flex items-center space-x-2 pt-2">
            <label className="text-sm font-medium flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={role === 'venueManager'}
                onChange={() => setRole(role === 'venueManager' ? 'Guest' : 'venueManager')}
                className="rounded border-gray-300 text-custom-blue focus:ring-custom-blue mr-2 h-4 w-4"
              />
              Register as a Venue Manager
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-custom-blue hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing up...' : 'Sign up'}
            </button>
          </div>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <p className="text-sm text-custom-gray">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-custom-orange hover:text-orange-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
