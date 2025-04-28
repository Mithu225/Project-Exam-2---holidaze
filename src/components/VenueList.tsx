'use client';
import { useEffect, useState } from 'react';
import { Venue } from '@/types/booking';
import Link from 'next/link';
import Image from 'next/image';
import { Navigation, Star, Users, Wifi, Car, Coffee, PawPrint } from 'lucide-react';

interface VenueCardProps {
  venue: Venue;
}

const VenueCard = ({ venue }: VenueCardProps) => {
  // Format price
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Get primary image or placeholder
  const venueImage = venue.media && venue.media.length > 0
    ? venue.media[0]
    : { url: '/asset/placeholder-venue.jpg', alt: 'No image available' };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      <div className="relative h-64 w-full">
        <Image
          src={venueImage.url}
          alt={venueImage.alt}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-custom-blue truncate" title={venue.name}>{venue.name}</h3>
        
        <div className="flex items-center mt-1 text-sm text-gray-600">
          <Navigation className="w-4 h-4 mr-1 flex-shrink-0 text-custom-blue" />
          <span className="truncate">{venue.location.city} {venue.location.country}</span>
        </div>
        

        
        <div className="mt-3 flex flex-wrap gap-2">
          {venue.meta.wifi && (
            <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-custom-blue">
              <Wifi className="w-3 h-3 mr-1" />
              WiFi
            </span>
          )}
          {venue.meta.parking && (
            <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-custom-blue">
              <Car className="w-3 h-3 mr-1" />
              Parking
            </span>
          )}
          {venue.meta.breakfast && (
            <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-custom-blue">
              <Coffee className="w-3 h-3 mr-1 " />
              Breakfast
            </span>
          )}
          {venue.meta.pets && (
            <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-custom-blue">
              <PawPrint className="w-3 h-3 mr-1" />
              Pets
            </span>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-custom-orange">{formatPrice(venue.price)}</span>
            <span className="text-sm text-gray-500">per night</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">{venue.rating.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="flex items-center mt-2 text-sm text-gray-600">
          <Users className="w-4 h-4 mr-1 text-custom-blue" />
          <span>Up to {venue.maxGuests} guests</span>
        </div>
        
        <div className="mt-auto pt-4">
          <Link href={`/venue/${venue.id}`} className="block">
            <button className="w-full bg-custom-blue text-white py-2 rounded-md hover:bg-blue-800 transition-colors">
              View Venue
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

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
    <div className="py-8" id="products">
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
