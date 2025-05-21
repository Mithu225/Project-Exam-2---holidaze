"use client";
import VenueDetails from "@/components/VenueDetails";
import { useRouter } from "next/router";

export default function Page() {
  const router = useRouter();
  return <VenueDetails venueId={router.query.id as string} />;
}
