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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

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
  
      const requestData = {
        ...values,
        ...(role === "venueManager" && { venueManager: true }),
      };

     
      if (!requestData.bio || requestData.bio.trim() === "") {
        delete requestData.bio;
      }

 
      const result = await registerUser(requestData);

      if (result.success) {
        setSuccess(true);
        toast({
          title: "Registration Successful!",
          description: "Your account has been created. You can now log in.",
          variant: "default",
        });


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
      <Card className="w-full max-w-md mx-auto shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-custom-blue">
            Registration Successful!
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Your account has been created successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <p className="text-custom-gray mb-4">
            Redirecting you to the login page...
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="bg-custom-blue hover:bg-blue-900"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-custom-blue">
          Register
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 "
          >
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
                      placeholder="Email@stud.noroff.no"
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
                      type="password"
                      placeholder="Min 08 characters"
                      {...field}
                    />
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
              <div
                className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mt-4"
                role="alert"
              >
                <p className="font-medium">
                  You&apos;re registering as a Venue Manager
                </p>
                <p>You&apos;ll be able to create and manage venue listings.</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-custom-blue hover:bg-blue-900"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-custom-orange hover:text-orange-700"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
