"use client";
import VenueDetails from "@/components/VenueDetails";
import { useRouter } from "next/router";

export default function VenueDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  return <VenueDetails venueId={id as string} />;
}
