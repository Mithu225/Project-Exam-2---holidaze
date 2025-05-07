"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  registerUser,
  registerSchema,
  RegisterFormValues,
  UserRole,
} from "@/services/authService";

export default function RegisterForm() {
  const [role, setRole] = useState<UserRole>("Guest");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      bio: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    setSuccess(false);

    try {
      // Prepare request data with conditional venueManager flag
      const requestData = {
        ...values,
        ...(role === "venueManager" && { venueManager: true }),
      };

      // Remove empty bio if not provided
      if (!requestData.bio || requestData.bio.trim() === "") {
        delete requestData.bio;
      }

      // Register user
      const result = await registerUser(requestData);

      if (result.success) {
        setSuccess(true);
        toast({
          title: "Registration Successful!",
          description: "Your account has been created. You can now log in.",
          variant: "default",
        });

        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast({
          title: "Registration Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Registration Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full mx-auto bg-white p-8 sm:p-10 rounded-lg shadow-md">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-custom-blue mb-2">
            Registration Successful!
          </h2>
          <p className="text-custom-gray mb-6">
            Your account has been created successfully.
          </p>
          <p className="text-custom-gray mb-4">
            Redirecting you to the login page...
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="bg-custom-blue hover:bg-blue-900"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-white p-8 sm:p-10 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-custom-blue">
          Create an account
        </h1>
        <p className="text-custom-gray">Sign up to get started with Holidaze</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-2">
              Account Type
            </h2>
            <div className="flex space-x-4 bg-gray-50 p-3 rounded-md">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="Guest"
                  checked={role === "Guest"}
                  onChange={() => setRole("Guest")}
                  className="h-4 w-4 text-custom-blue focus:ring-custom-blue"
                />
                <span className="ml-2 text-sm text-gray-700">Traveler</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="venueManager"
                  checked={role === "venueManager"}
                  onChange={() => setRole("venueManager")}
                  className="h-4 w-4 text-custom-blue focus:ring-custom-blue"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Venue Manager
                </span>
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
                  <Input
                    placeholder="Your name (letters, numbers, underscore only)"
                    {...field}
                  />
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
                  <Input
                    type="email"
                    placeholder="your.email@stud.noroff.no"
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
                  <Input
                    placeholder="Tell us about yourself (max 160 characters)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {role === "venueManager" && (
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mt-4">
              <p className="font-medium">
                You're registering as a Venue Manager
              </p>
              <p>You'll be able to create and manage venue listings.</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-custom-blue hover:bg-blue-900 text-white py-2 mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <p className="text-sm text-custom-gray">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-custom-orange hover:text-orange-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
