"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { Venue } from "@/types/booking"; // Use the shared Venue type

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);


  const handleVenueCreated = (event: CustomEvent<Venue>) => {
    // Add the newly created venue to the venues list
    const newVenue = event.detail;

    if (newVenue && newVenue.id) {
      setVenues((prevVenues) => [newVenue, ...prevVenues]);
    }
  };

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        
        const userVenues = localStorage.getItem("userVenues");
        let localVenues: Venue[] = [];

        if (userVenues) {
          try {
            localVenues = JSON.parse(userVenues);
            console.log(
              "Found user-created venues in search:",
              localVenues.length
            );
          } catch (parseError) {
            console.error(
              "Error parsing user venues from localStorage:",
              parseError
            );
          }
        }

        
        const timestamp = Date.now();
        const apiUrl = `https://v2.api.noroff.dev/holidaze/venues?_=${timestamp}`;

    
        const response = await fetch(apiUrl, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
        const result = await response.json();
        let apiVenues: Venue[] = [];

        if (result?.data) {
          apiVenues = result.data;
        }

        setVenues([...localVenues, ...apiVenues]);
      } catch (error) {
        console.error("Error fetching venues:", error);

      
        const userVenues = localStorage.getItem("userVenues");
        if (userVenues) {
          try {
            const localVenues = JSON.parse(userVenues);
            setVenues(localVenues);
          } catch (parseError) {
            console.error(
              "Error parsing user venues from localStorage:",
              parseError
            );
          }
        }
      }
    };

    fetchVenues();

  
    window.addEventListener(
      "venueCreated",
      handleVenueCreated as EventListener
    );

    return () => {
      window.removeEventListener(
        "venueCreated",
        handleVenueCreated as EventListener
      );
    };
  }, []);

  const filteredVenues = venues.filter((venue) => {
    const searchTerm = query.toLowerCase();
    return (
     
      (venue.name?.toLowerCase() || "").includes(searchTerm) ||
    
      (venue.location?.city?.toLowerCase() || "").includes(searchTerm) ||
     
      (venue.location?.country?.toLowerCase() || "").includes(searchTerm)
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
     
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
                <div className="font-medium">
                  {venue.name || "Unnamed Venue"}
                </div>
                <div className="text-sm text-gray-500">
                  {venue.location?.city ? venue.location.city : ""}
                  {venue.location?.city && venue.location?.country ? ", " : ""}
                  {venue.location?.country || ""}
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
