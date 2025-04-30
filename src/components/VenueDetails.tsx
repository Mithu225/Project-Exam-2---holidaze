'use client';
import Image from 'next/image';
import { Venue } from '@/types/booking';
import { Star, Wifi, Car, Coffee, PawPrint, Users, Navigation } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface VenueDetailsProps {
  venueId: string;
}

export default function VenueDetails({ venueId }: VenueDetailsProps) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const response = await fetch(`https://v2.api.noroff.dev/holidaze/venues/${venueId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch venue: ${response.statusText}`);
        }
        const data = await response.json();
        setVenue(data.data);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load venue details';
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchVenue();
  }, [venueId]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-white-400 text-gray-400'
        }`}
      />
    ));
  };

  // Format price
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!venue) return <div className="text-center py-8">Venue not found</div>;

  const handleBookNow = () => {
    // Navigate to booking page with venue ID
    router.push(`/booking/${venue.id}`);
  };

  const handleExploreMore = () => {
    router.push('/');
  };

  // Get primary image or placeholder
  const venueImage = venue.media && venue.media.length > 0
    ? venue.media[0]
    : { url: '/asset/placeholder-venue.jpg', alt: 'No image available' };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 p-6">
          <div className="relative h-[500px]">
            <Image
              src={venueImage.url}
              alt={venueImage.alt}
              fill
              className="object-cover rounded-lg"
            />
          </div>

          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-custom-blue mb-4">{venue.name}</h1>
            
            <div className="flex items-center mt-2 text-gray-600">
              <Navigation className="w-5 h-5 mr-2 text-custom-blue" />
              <span>
                {venue.location?.city || ''}
                {venue.location?.city && venue.location?.country ? ', ' : ''}
                {venue.location?.country || ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-4 mb-2">
              <span className="text-2xl font-bold text-custom-orange">{formatPrice(venue.price)}</span>
              <span className="text-gray-600">per night</span>
            </div>

            <div className="flex items-center mb-4">
              <div className="flex">{renderStars(venue.rating)}</div>
              <span className="ml-2 text-gray-600">({venue.rating.toFixed(1)} out of 5)</span>
            </div>
            
            <div className="flex items-center mt-2 mb-4 text-gray-600">
              <Users className="w-5 h-5 mr-2 text-custom-blue" />
              <span>Up to {venue.maxGuests} guests</span>
            </div>

            <p className="text-gray-600 mb-6">{venue.description}</p>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-custom-blue">Amenities</h3>
              <div className="flex flex-wrap gap-3">
                {venue.meta?.wifi && (
                  <span className="inline-flex items-center bg-gray-100 px-3 py-1 rounded text-sm text-custom-blue">
                    <Wifi className="w-4 h-4 mr-2" />
                    WiFi
                  </span>
                )}
                {venue.meta?.parking && (
                  <span className="inline-flex items-center bg-gray-100 px-3 py-1 rounded text-sm text-custom-blue">
                    <Car className="w-4 h-4 mr-2" />
                    Parking
                  </span>
                )}
                {venue.meta?.breakfast && (
                  <span className="inline-flex items-center bg-gray-100 px-3 py-1 rounded text-sm text-custom-blue">
                    <Coffee className="w-4 h-4 mr-2" />
                    Breakfast
                  </span>
                )}
                {venue.meta?.pets && (
                  <span className="inline-flex items-center bg-gray-100 px-3 py-1 rounded text-sm text-custom-blue">
                    <PawPrint className="w-4 h-4 mr-2" />
                    Pets allowed
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-row gap-4 mt-auto">
              <button 
                onClick={handleBookNow} 
                className="bg-custom-blue text-white py-3 px-6 rounded-md hover:bg-blue-600 transition-colors"
              >
                Book Now
              </button>
              <button 
                onClick={handleExploreMore}
                className="bg-white border border-custom-blue text-custom-blue py-3 px-6 rounded-md hover:bg-gray-50 transition-colors"
              >
                Explore More Venues
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
