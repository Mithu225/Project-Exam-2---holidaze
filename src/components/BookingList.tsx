'use client';
import { useEffect, useState } from 'react';
import BookingCard from './BookingCard';
import { Booking } from '@/types/booking';

const BookingList = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const response = await fetch('https://v2.api.noroff.dev/holidaze/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setBookings(data.data);
        setLoading(false);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bookings';
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-blue"></div>
    </div>
  );
  
  if (error) return (
    <div className="text-center py-10">
      <div className="text-red-500 font-medium mb-2">{error}</div>
      {error === 'Authentication required' && (
        <p className="text-gray-600">Please <a href="/login" className="text-custom-blue hover:underline">log in</a> to view your bookings.</p>
      )}
    </div>
  );

  if (bookings.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">No Bookings Yet</h2>
        <p className="text-gray-600 mb-6">You don't have any bookings yet.</p>
        <a href="/venues" className="bg-custom-blue text-white px-6 py-2 rounded-md hover:bg-blue-800 transition-colors">
          Explore Venues
        </a>
      </div>
    );
  }

  return (
    <div className="py-8" id="bookings">
      <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Your Bookings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
};

export default BookingList;
