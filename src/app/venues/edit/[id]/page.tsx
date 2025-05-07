"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchVenueDetails } from "@/utils/api";
import { Venue } from "@/types/booking";
import EditVenueForm from "@/components/form/EditVenueForm";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EditVenuePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenue = async () => {
      if (!params.id) {
        setError("No venue ID provided");
        setLoading(false);
        return;
      }

      try {
        const result = await fetchVenueDetails(params.id as string);

        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setVenue(result.data);
        } else {
          setError("Failed to fetch venue data");
        }
      } catch (err) {
        console.error("Error fetching venue:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [params.id]);

  const handleSuccess = () => {
    toast({
      title: "Success!",
      description: "Venue updated successfully",
    });
    router.push("/profile");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading venue details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/profile">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Profile
            </Button>
          </Link>
        </div>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
          <h2 className="text-red-700 text-lg font-bold mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
        <div className="flex justify-center">
          <Button onClick={() => router.push("/profile")}>
            Return to Profile
          </Button>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8 rounded">
          <h2 className="text-yellow-700 text-lg font-bold mb-2">
            Venue Not Found
          </h2>
          <p className="text-yellow-700">
            The requested venue could not be found.
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={() => router.push("/profile")}>
            Return to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/profile">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-6">
          Edit Venue: {venue.name}
        </h1>
      </div>

      <EditVenueForm venue={venue} onSuccess={handleSuccess} />
    </div>
  );
}
