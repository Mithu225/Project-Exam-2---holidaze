'use client';
import { useEffect, useState } from 'react';
import { Venue } from '@/types/booking';
import VenueCard from './VenueCard';
import { Search, RefreshCw } from 'lucide-react';

const VenueList = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Function to refresh venues with visual feedback
  const refreshVenues = async () => {
    setIsRefreshing(true);
    try {
      await fetchVenues();
    } finally {
      // Add a slight delay so the user sees the refresh animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const fetchVenues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First check for locally created venues in localStorage
      const userVenues = localStorage.getItem('userVenues');
      let localVenues: Venue[] = [];
      
      if (userVenues) {
        try {
          localVenues = JSON.parse(userVenues);
          console.log('Found user-created venues in localStorage:', localVenues.length);
          
          // Sort local venues by creation date (most recent first)
          if (localVenues.length > 0) {
            localVenues.sort((a, b) => {
              const aId = a.id.split('-')[1] || '0';
              const bId = b.id.split('-')[1] || '0';
              return parseInt(bId) - parseInt(aId);
            });
          }
        } catch (parseError) {
          console.error('Error parsing user venues from localStorage:', parseError);
        }
      }
      
      // Add timestamp for cache busting
      const timestamp = Date.now();
      const apiUrl = `https://v2.api.noroff.dev/holidaze/venues?_=${timestamp}`;
      
      // Then fetch from API with cache busting
      const response = await fetch(apiUrl, {
        cache: 'no-store', // Tell fetch to always get fresh data
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let apiVenues = data.data || [];
      
      // Filter out any API venues that might have the same ID as local venues
      // (this is unlikely with our temp ID scheme, but good practice)
      const localVenueIds = new Set(localVenues.map((v: Venue) => v.id));
      apiVenues = apiVenues.filter((v: Venue) => !localVenueIds.has(v.id));
      
      // Process owner information for all venues
      apiVenues = apiVenues.map((venue: Venue) => {
        if (typeof venue.owner === 'string') {
          venue.owner = {
            name: venue.owner,
            email: `${venue.owner.toLowerCase().replace(/\\s+/g, '.')}@holidaze.com`,
            avatar: null
          };
        }
        return venue;
      });
      
      // Combine venues, placing local venues at the top
      const allVenues = [...localVenues, ...apiVenues];
      setVenues(allVenues);
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch venues';
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch when component mounts
    fetchVenues();
    
    // Clear any cached data
    sessionStorage.removeItem('venueCache');
    localStorage.removeItem('venueCache');
  }, []);

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
            className="mt-4 flex items-center bg-custom-blue text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredVenues = searchTerm
    ? venues.filter(venue => {
        const searchLower = searchTerm.toLowerCase();
        return (
          venue.name?.toLowerCase().includes(searchLower) ||
          venue.description?.toLowerCase().includes(searchLower) ||
          venue.location?.city?.toLowerCase().includes(searchLower) ||
          venue.location?.country?.toLowerCase().includes(searchLower)
        );
      })
    : venues;

  return (
    <div className="container mx-auto px-4 pb-8">
      {/* Search bar */}
      <div className="relative mb-8 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-custom-blue">Find Your Perfect Venue</h2>
          <button 
            onClick={refreshVenues}
            className={`flex items-center text-custom-blue hover:text-blue-700 ${isRefreshing ? 'opacity-50' : ''}`}
            disabled={isRefreshing}
          >
            <RefreshCw size={18} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Venues'}
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search venues by name, location, or features..."
            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      </div>



      {/* Main venues list */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-custom-blue">
            {searchTerm 
              ? `Search Results (${filteredVenues.length})` 
              : 'All Available Venues'}
          </h2>
          {filteredVenues.some(v => v.id.startsWith('temp-')) && (
            <span className="text-sm bg-custom-orange text-white px-2 py-1 rounded">
              New venues added
            </span>
          )}
        </div>
        
        {filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredVenues.map(venue => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded">
            <p>No venues found matching "{searchTerm}". Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueList;
