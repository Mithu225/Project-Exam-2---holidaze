import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Loader } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Venue } from "@/types/booking";
import EditVenueForm from "@/components/form/EditVenueForm";
import { fetchWithAuth } from "@/utils/api";

// Main page component
export default function EditVenuePage() {
  const router = useRouter();
  const { id } = router.query;
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch venue data when component mounts - with useCallback to prevent unnecessary re-renders
  const fetchVenue = useCallback(async (venueId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `https://v2.api.noroff.dev/holidaze/venues/${venueId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch venue (Status: ${response.status})`);
      }

      const result = await response.json();
      setVenue(result.data);
      return result.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch venue data";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle successful form submission
  const handleSuccess = () => {
    // Redirect to profile page after successful update
    router.push("/profile");
  };

  // Load venue data only once when ID is available
  useEffect(() => {
    if (id && typeof id === "string" && !venue) {
      fetchVenue(id);
    }
  }, [id, fetchVenue, venue]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-10 h-10 animate-spin text-custom-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Venue Not Found</AlertTitle>
          <AlertDescription>
            We couldn&apos;t find the venue you&apos;re looking for. Please
            check the URL and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Venue | Holidaze</title>
        <meta name="description" content="Edit your venue details" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-custom-blue text-center mb-6">Edit Venue</h1>
        <EditVenueForm venue={venue} onSuccess={handleSuccess} />
      </div>
    </>
  );
}
