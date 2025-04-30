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
        
        const response = await fetch('https://v2.api.noroff.dev/holidaze/venues');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setVenues(data.data);
        setLoading(false);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch venues';
        setError(errorMessage);
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

  return (
    <div className="py-8" id="venues">
      <h1 className="text-2xl font-bold text-center mb-8 text-custom-blue">Featured Stays</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
    </div>
  );
};

export default VenueList;
