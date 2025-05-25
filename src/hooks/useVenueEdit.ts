import { useState } from "react";
import { fetchWithAuth } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Venue } from "@/types/booking";

export type VenueUpdateData = {
  name?: string;
  description?: string;
  media?: {
    url: string;
    alt: string;
  }[];
  price?: number;
  maxGuests?: number;
  rating?: number;
  meta?: {
    wifi: boolean;
    parking: boolean;
    breakfast: boolean;
    pets: boolean;
  };
  location?: {
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    continent?: string;
    lat?: number;
    lng?: number;
  };
};

export function useVenueEdit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const updateVenue = async (
    venueId: string,
    venueData: VenueUpdateData
  ): Promise<{ success: boolean; data?: Venue }> => {
    setIsLoading(true);
    setError(null);

    try {
      const processedData = { ...venueData };

      if (venueData.media) {
        const validMedia = venueData.media.filter((m) => m.url.trim() !== "");
        if (validMedia.length === 0) {
          processedData.media = [
            {
              url: "/asset/placeholder-venue.jpg",
              alt: venueData.name || "Venue",
            },
          ];
        } else {
          processedData.media = validMedia;
        }
      }

      const response = await fetchWithAuth(
        `https://v2.api.noroff.dev/holidaze/venues/${venueId}`,
        {
          method: "PUT",
          body: JSON.stringify(processedData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.errors?.[0]?.message ||
          errorData.message ||
          `Failed to update venue: ${response.status}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      return { success: true, data: responseData.data };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update venue";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Error updating venue:", error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateVenue,
    isLoading,
    error,
  };
}
