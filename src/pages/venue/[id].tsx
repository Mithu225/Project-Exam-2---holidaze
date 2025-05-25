"use client";
import VenueDetails from "@/components/VenueDetails";
import { useRouter } from "next/router";

export default function VenueDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
 
  if (!router.isReady || !id) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
        <div className="animate-pulse text-custom-blue">Loading venue details...</div>
      </div>
    );
  }

  return <VenueDetails venueId={id as string} />;
}
