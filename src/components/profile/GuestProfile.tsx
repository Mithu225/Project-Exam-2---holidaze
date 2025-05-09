"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  User,
  Mail,
  Calendar,
  Edit,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/router";
import BookingList from "../BookingList";
import {
  useProfileUpdate,
  ProfileFormData,
  profileUpdateSchema,
} from "@/hooks/useProfileUpdate";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface GuestData {
  name: string;
  email: string;
  bio?: string | null;
  role?: string;
  avatar?: {
    url: string;
    alt: string;
  };
  banner?: {
    url: string;
    alt: string;
  };
}

export default function GuestProfile() {
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { updateProfile, isLoading, error } = useProfileUpdate();

  // Setup form with react-hook-form and zod validation
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      bio: "",
      avatarUrl: "",
      bannerUrl: "",
    },
  });

  useEffect(() => {
    const storedGuest = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!storedGuest || !token) {
      router.push("/login");
      return;
    }

    try {
      const guest = JSON.parse(storedGuest);
      setGuestData(guest);

      // Initialize form with guest profile data
      form.reset({
        bio: guest.bio || "", // Convert null/undefined to empty string
        avatarUrl: guest.avatar?.url || "",
        bannerUrl: guest.banner?.url || "",
      });
    } catch (error) {
      console.error("Failed to parse guest data:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast, form]);

  const handleEditFormOpen = () => {
    // Reset form data with current values
    if (guestData) {
      form.reset({
        bio: guestData.bio || "", // Convert null/undefined to empty string
        avatarUrl: guestData.avatar?.url || "",
        bannerUrl: guestData.banner?.url || "",
      });
    }
    setShowEditForm(true);
  };

  const handleEditFormClose = () => {
    setShowEditForm(false);
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!guestData) return;

    // Prepare the data for the API
    const updateData = {
      bio: data.bio?.trim() === "" ? null : data.bio,
      ...(data.avatarUrl && {
        avatar: {
          url: data.avatarUrl,
          alt: "Guest avatar",
        },
      }),
      ...(data.bannerUrl && {
        banner: {
          url: data.bannerUrl,
          alt: "Guest banner",
        },
      }),
    };

    // Update profile through the API
    const success = await updateProfile(guestData.name, updateData);

    if (success) {
      // Show success toast
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "default",
      });

      // Update local state with new data
      setGuestData((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          bio: data.bio?.trim() === "" ? null : data.bio,
          avatar: data.avatarUrl
            ? {
                url: data.avatarUrl,
                alt: "Guest avatar",
              }
            : prev.avatar,
          banner: data.bannerUrl
            ? {
                url: data.bannerUrl,
                alt: "Guest banner",
              }
            : prev.banner,
        };
      });

      // Close the form
      setShowEditForm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!guestData) {
    return (
      <div className="text-center py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      {/* Banner and Avatar */}
      <div className="relative w-full h-48 mb-16 rounded-lg bg-white">
        {guestData.banner ? (
          <Image
            src={guestData.banner.url}
            alt={guestData.banner.alt || "Profile banner"}
            fill
            className="object-cover rounded-2xl"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-400 rounded-2xl"></div>
        )}

        <div className="absolute -bottom-12 left-6 w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
          {guestData.avatar ? (
            <Image
              src={guestData.avatar.url}
              alt={guestData.avatar.alt || "Avatar"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <User className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">{guestData.name}</h1>
          <div className="text-gray-600 mt-1 mb-3 max-w-xs flex">
            {guestData.bio ? (
              <>
                <span className="italic flex-none">&ldquo;</span>
                <span className="italic truncate">{guestData.bio}</span>
                <span className="italic flex-none">&rdquo;</span>
              </>
            ) : (
              <span className="text-custom-gray">Your Bio shows here</span>
            )}
          </div>
          <div className="flex items-center text-muted-foreground mt-1">
            <Mail className="w-4 h-4 mr-1" />
            <span>{guestData.email}</span>
          </div>
          <div className="flex items-center text-muted-foreground mt-1">
            <Calendar className="w-4 h-4 mr-1" />
            <span>
              Member since April 2025 as a{" "}
              <span className="capitalize">{guestData.role || "Guest"}</span>
            </span>
          </div>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button
            variant="customBlue"
            onClick={handleEditFormOpen}
            className="flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Edit Profile Form */}
      {showEditForm && (
        <div className="mt-8 p-6 bg-card rounded-lg shadow-md border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary">Edit Profile</h2>
            <Button onClick={handleEditFormClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a bit about yourself"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter avatar image URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bannerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter banner image URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3 pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEditFormClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {/* Bookings List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          My Bookings
        </h2>
        <BookingList />
      </div>
    </div>
  );
}
