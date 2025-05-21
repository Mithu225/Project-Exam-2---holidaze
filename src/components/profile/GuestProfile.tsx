"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Mail, Calendar, Edit, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import BookingList from "../BookingList";
import {
  useProfileUpdate,
  ProfileFormData,
  profileUpdateSchema,
} from "@/hooks/useProfileUpdate";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import GuestEditProfileForm from "@/components/form/GuestEditProfileForm";

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

      form.reset({
        bio: guest.bio || "", 
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
   
    if (guestData) {
      form.reset({
        bio: guestData.bio || "",  
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

   
    const success = await updateProfile(guestData.name, updateData);

    if (success) {
     
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "default",
      });

    
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

   
      {showEditForm && (
        <GuestEditProfileForm
          form={form}
          isLoading={isLoading}
          error={error}
          onSubmit={onSubmit}
          onCancel={handleEditFormClose}
        />
      )}

      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          My Bookings
        </h2>
        <BookingList />
      </div>
    </div>
  );
}
