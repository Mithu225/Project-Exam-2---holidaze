"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import Link from "next/link";
import { Venue } from "@/types/booking";
import VenueCard from "@/components/VenueCard";

export default function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);
  


  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://v2.api.noroff.dev/holidaze/venues");
        const result = await response.json();
        
        if (result?.data) {
          setVenues(result.data);
        }
      } catch (error) {
        console.error("Error fetching venues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

 
  const filteredVenues = venues.filter((venue) => {
    const searchLower = query.toLowerCase();
    
    if (!searchLower) return true;
    

    return (venue.name?.toLowerCase() || "").includes(searchLower) ||
      (venue.location?.city?.toLowerCase() || "").includes(searchLower) ||
      (venue.location?.country?.toLowerCase() || "").includes(searchLower) ||
      (venue.description?.toLowerCase() || "").includes(searchLower);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-custom-blue mb-2">
          Search Results
        </h1>
        <p className="text-gray-600 mb-4">
          {filteredVenues.length} {filteredVenues.length === 1 ? "venue" : "venues"} found for &ldquo;{query}&rdquo;
        </p>
        
      

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredVenues.length} of {venues.length} venues
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-blue"></div>
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">No venues found matching your search.</p>
          <p className="text-gray-400 mt-2">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
            {filteredVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
          
          <div className="flex justify-center pb-8">
            <Link 
              href="/" 
              className="px-6 py-3 bg-white border border-custom-blue text-custom-blue rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              Browse All Venues
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
