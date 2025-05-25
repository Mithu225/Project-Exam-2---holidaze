"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Venue } from "@/types/booking";
import VenueCard from "./VenueCard";
import { Search, RefreshCw } from "lucide-react";
import React from "react";

interface SearchInputProps {
  onSearch: (term: string) => void;
  initialValue?: string;
}

const SearchInput = React.memo<SearchInputProps>(function SearchInput({
  onSearch,
  initialValue = "",
}) {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onSearch(searchTerm);
      }
    },
    [onSearch, searchTerm]
  );

  return (
    <div className="relative">
      <label htmlFor="venue-search" className="sr-only">
        Search Venues
      </label>
      <input
        id="venue-search"
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        onKeyPress={handleKeyPress}
        placeholder="Search venues by name, location, or features... (Press Enter to search)"
        className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent"
      />
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-6 w-6 text-gray-400" />
      </div>
    </div>
  );
});

const VenueList = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const observer = useRef<IntersectionObserver | null>(null);
  const ITEMS_PER_PAGE = 10;

  const searchVenues = useCallback(
    async (
      keyword: string,
      pageNum: number = 1,
      isRefresh: boolean = false
    ) => {
      if (isRefresh) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      setIsSearching(true);

      try {
        const apiUrl = `https://v2.api.noroff.dev/holidaze/venues/search?q=${keyword}&limit=${ITEMS_PER_PAGE}&page=${pageNum}`;

        const response = await fetch(apiUrl, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const searchResults = data.data || [];

        setHasMore(searchResults.length === ITEMS_PER_PAGE);

        setVenues((prevVenues) => {
          if (isRefresh) {
            return searchResults;
          }
          return [...prevVenues, ...searchResults];
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch venues";
        setError(errorMessage);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
        setIsSearching(false);
      }
    },
    [ITEMS_PER_PAGE]
  );

  const handleSearch = useCallback(
    async (term: string) => {
      setCurrentSearchTerm(term);
      setPage(1);
      setVenues([]);
      if (term) {
        await searchVenues(term, 1, true);
      } else {
        await fetchVenues(1, true);
      }
    },
    [searchVenues]
  );

  const refreshVenues = async () => {
    setIsRefreshing(true);
    try {
      setPage(1);
      setVenues([]);
      await fetchVenues(1, true);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const fetchVenues = useCallback(
    async (pageNum: number = 1, isRefresh: boolean = false) => {
      if (isRefresh) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const userVenues = localStorage.getItem("userVenues");
        let localVenues: Venue[] = [];

        if (userVenues) {
          try {
            localVenues = JSON.parse(userVenues);
            if (localVenues.length > 0) {
              localVenues.sort((a, b) => {
                const aId = a.id.split("-")[1] || "0";
                const bId = b.id.split("-")[1] || "0";
                return parseInt(bId) - parseInt(aId);
              });
            }
          } catch (parseError) {
            console.error(
              "Error parsing user venues from localStorage:",
              parseError
            );
          }
        }

        const apiUrl = `https://v2.api.noroff.dev/holidaze/venues?sort=created&sortOrder=desc&_owner=true&limit=${ITEMS_PER_PAGE}&page=${pageNum}`;

        const response = await fetch(apiUrl, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        let apiVenues = data.data || [];

        setHasMore(apiVenues.length === ITEMS_PER_PAGE);

        const localVenueIds = new Set(localVenues.map((v: Venue) => v.id));
        apiVenues = apiVenues.filter((v: Venue) => !localVenueIds.has(v.id));

        apiVenues = apiVenues.map((venue: Venue) => {
          if (typeof venue.owner === "string") {
            const ownerName = venue.owner as string;
            venue.owner = {
              name: ownerName,
              email: `${ownerName
                .toLowerCase()
                .replace(/\s+/g, ".")}@holidaze.com`,
              avatar: "",
            };
          }
          return venue;
        });

        setVenues((prevVenues) => {
          if (isRefresh) {
            return [...localVenues, ...apiVenues];
          }
          return [...prevVenues, ...apiVenues];
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch venues";
        setError(errorMessage);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [ITEMS_PER_PAGE]
  );

  const lastVenueElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, isLoadingMore]
  );

  useEffect(() => {
    fetchVenues(1, true);

    window.addEventListener(
      "venueCreated",
      handleVenueCreated as EventListener
    );

    sessionStorage.removeItem("venueCache");
    localStorage.removeItem("venueCache");

    return () => {
      window.removeEventListener(
        "venueCreated",
        handleVenueCreated as EventListener
      );
    };
  }, []);

  useEffect(() => {
    if (!isSearching) {
      const loadMoreData = async () => {
        if (page > 1) {
          await fetchVenues(page, false);
        }
      };
      loadMoreData();
    }
  }, [page, isSearching]);

  const handleVenueCreated = (event: CustomEvent<Venue>) => {
    const newVenue = event.detail;

    if (newVenue && newVenue.id) {
      if (typeof newVenue.owner === "string") {
        const ownerName = newVenue.owner as string;
        newVenue.owner = {
          name: ownerName,
          email: `${ownerName.toLowerCase().replace(/\s+/g, ".")}@holidaze.com`,
          avatar: "",
        };
      }

      setVenues((prevVenues) => [newVenue, ...prevVenues]);
    }
  };

  if (loading && venues.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-blue"></div>
        </div>
      </div>
    );
  }

  if (error && venues.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error loading venues</p>
          <p>{error}</p>
          <button
            onClick={refreshVenues}
            className="mt-4 flex items-center bg-custom-blue text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      <div className="relative mb-8 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-custom-blue">
            Find Your Perfect Venue
          </h2>
          <button
            onClick={refreshVenues}
            className={`flex items-center text-custom-blue hover:text-blue-700 ${
              isRefreshing ? "opacity-50" : ""
            }`}
            disabled={isRefreshing}
          >
            <RefreshCw
              size={18}
              className={`mr-1 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Venues"}
          </button>
        </div>

        <SearchInput onSearch={handleSearch} initialValue={currentSearchTerm} />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-custom-blue">
            {currentSearchTerm
              ? `Search Results for "${currentSearchTerm}" (${venues.length})`
              : "All Available Venues"}
          </h2>
          {venues.some((v) => v.id.startsWith("temp-")) && (
            <span className="text-sm bg-custom-orange text-white px-2 py-1 rounded">
              New venues added
            </span>
          )}
        </div>

        {isSearching && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-blue"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Error loading venues</p>
            <p>{error}</p>
            <button
              onClick={refreshVenues}
              className="mt-4 flex items-center bg-custom-blue text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              <RefreshCw size={16} className="mr-2" />
              Try Again
            </button>
          </div>
        )}

        {venues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {venues.map((venue, index) => (
              <div
                key={venue.id}
                ref={index === venues.length - 1 ? lastVenueElementRef : null}
              >
                <VenueCard venue={venue} />
              </div>
            ))}
          </div>
        ) : (
          !isSearching && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded">
              <p>
                {currentSearchTerm
                  ? `No venues found matching "${currentSearchTerm}". Try a different search term.`
                  : "No venues found. Try a different search term."}
              </p>
            </div>
          )
        )}
        {isLoadingMore && (
          <div className="flex justify-center items-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-blue"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueList;
