import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/router";
import { fetchWithAuth } from "@/utils/api";
import * as z from "zod";

// Zod validation schema for profile updates
export const profileUpdateSchema = z.object({
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
  avatarUrl: z
    .string()
    .url("Please enter a valid URL")
    .max(300, "URL must be 300 characters or less")
    .optional(),
  bannerUrl: z
    .string()
    .url("Please enter a valid URL")
    .max(300, "URL must be 300 characters or less")
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileUpdateSchema>;

export interface ProfileUpdateData {
  bio?: string | null;
  avatar?: {
    url: string;
    alt: string;
  };
  banner?: {
    url: string;
    alt: string;
  };
}

export function useProfileUpdate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Update profile function
  const updateProfile = async (
    username: string,
    data: ProfileUpdateData
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `https://v2.api.noroff.dev/holidaze/profiles/${username}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.errors?.[0]?.message || "Failed to update profile"
        );
      }

      const result = await response.json();

      // Update the local storage with the updated profile data
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUserData = {
          ...userData,
          ...data,
        };
        localStorage.setItem("user", JSON.stringify(updatedUserData));
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateProfile,
    isLoading,
    error,
  };
}
