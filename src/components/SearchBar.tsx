"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  
  interface Venue {
    id: string;
    name: string;
    description: string;
    price: number;
    location: {
      city: string;
      country: string;
    };
    media: {
      url: string;
      alt: string;
    }[];
    rating: number;
  }

  const [venues, setVenues] = useState<Venue[]>([]);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch("https://v2.api.noroff.dev/holidaze/venues");
        const result = await response.json();
        if (result?.data) {
          setVenues(result.data);
        }
      } catch (error) {
        console.error("Error fetching venues:", error);
      }
    };

    fetchVenues();
  }, []);

  const filteredVenues = venues.filter((venue) => {
    const searchTerm = query.toLowerCase();
    return (
      // Check name
      (venue.name?.toLowerCase() || '').includes(searchTerm) ||
      // Check city if location exists
      (venue.location?.city?.toLowerCase() || '').includes(searchTerm) ||
      // Check country if location exists
      (venue.location?.country?.toLowerCase() || '').includes(searchTerm)
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Navigate to search results page with the query parameter
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setQuery("");
    }
  };

  const handleVenueClick = (venueId: string) => {
    router.push(`/venue/${venueId}`);
    setQuery(""); 
  };

  return (
    <form onSubmit={handleSearch} className="relative w-1/3 max-w-lg">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for venues, cities..."
        className="w-full pl-10 pr-3 py-2 border border-custom-orange rounded-md bg-transparent text-custom-blue placeholder:text-custom-blue "
      />
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-custom-blue"
        size={20}
      />

      {query && (
        <div className="absolute top-full mt-2 w-full bg-white text-custom-blue rounded-md shadow-lg p-2 z-50">
          {filteredVenues.length > 0 ? (
            filteredVenues.map((venue) => (
              <div
                key={venue.id}
                onClick={() => handleVenueClick(venue.id)}
                className="p-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <div className="font-medium">{venue.name || 'Unnamed Venue'}</div>
                <div className="text-sm text-gray-500">
                  {venue.location?.city ? venue.location.city : ''}
                  {venue.location?.city && venue.location?.country ? ', ' : ''}
                  {venue.location?.country || ''}
                </div>
              </div>
            ))
          ) : (
            <div className="p-2">No venues found</div>
          )}
        </div>
      )}
    </form>
  );
}
