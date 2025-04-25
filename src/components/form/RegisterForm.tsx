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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

type UserRole = 'user' | 'venueManager';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' })
    .refine(email => email.endsWith('stud.noroff.no'), {
      message: 'Email must be a Noroff email (stud.noroff.no)'
    }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  avatar: z.string().url({ message: 'Avatar must be a valid URL' }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterForm() {
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      avatar: '',
    },
  });
  
  const router = useRouter();

  const onSubmit = async (values: FormValues) => {
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('https://v2.api.noroff.dev/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: values.name,
          email: values.email, 
          password: values.password,
          avatar: values.avatar ? { url: values.avatar, alt: `Avatar for ${values.name}` } : undefined
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const { data } = await response.json();
      
      console.log(`Successfully registered as ${data.name}`);
      
      // Redirect to login page
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
      <h2 className="text-2xl font-bold text-center text-custom-blue mb-8">SIGN UP</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
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
                  value="user"
                  checked={role === 'user'}
                  onChange={() => setRole('user')}
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
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} />
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
                  <Input type="email" placeholder="mail@stud.noroff.no" {...field} />
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
                  <Input type="password" placeholder="min 08 characters" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar URL (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/avatar.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
