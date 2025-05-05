'use client';
import { useEffect, useState } from 'react';
import { Venue } from '@/types/booking';
import VenueCard from './VenueCard';

const VenueList = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        // First check for locally created venues in localStorage
        const userVenues = localStorage.getItem('userVenues');
        let localVenues: Venue[] = [];
        
        if (userVenues) {
          try {
            localVenues = JSON.parse(userVenues);
            console.log('Found user-created venues in localStorage:', localVenues.length);
          } catch (parseError) {
            console.error('Error parsing user venues from localStorage:', parseError);
          }
        }
        
        // Then fetch from API
        const response = await fetch('https://v2.api.noroff.dev/holidaze/venues');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        let apiVenues = data.data || [];
        
        // Filter out any API venues that might have the same ID as local venues
        // (this is unlikely with our temp ID scheme, but good practice)
        const localVenueIds = new Set(localVenues.map((v: Venue) => v.id));
        apiVenues = apiVenues.filter((v: Venue) => !localVenueIds.has(v.id));
        
        // Combine venues, placing local venues at the top
        const allVenues = [...localVenues, ...apiVenues];
        setVenues(allVenues);
        setLoading(false);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch venues';
        setError(errorMessage);
        
        // Even if API fails, try to show local venues
        const userVenues = localStorage.getItem('userVenues');
        if (userVenues) {
          try {
            const localVenues = JSON.parse(userVenues);
            setVenues(localVenues);
            setError('Showing locally created venues only. ' + errorMessage);
          } catch (parseError) {
            console.error('Error parsing user venues from localStorage:', parseError);
          }
        }
        
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-blue"></div>
    </div>
  );
  
  if (error) return (
    <div className="text-center py-10">
      <div className="text-red-500 font-medium mb-2">{error}</div>
    </div>
  );

  if (venues.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">No Venues Available</h2>
        <p className="text-gray-600">Check back later for exciting places to stay!</p>
      </div>
    );
  }

  // Separate user-created venues (those with temp- IDs) and regular venues
  const userCreatedVenues = venues.filter(venue => venue.id.startsWith('temp-'));
  const regularVenues = venues.filter(venue => !venue.id.startsWith('temp-'));

  return (
    <div className="py-8" id="venues">
      <h1 className="text-2xl font-bold text-center mb-8 text-custom-blue">Featured Stays</h1>
      
      {userCreatedVenues.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-custom-blue border-b pb-2">Recently Added Venues</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
            {userCreatedVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
        {regularVenues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
    </div>
  );
};

export default VenueList;
