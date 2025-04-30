'use client';
import { useEffect, useState } from 'react';
import BookingCard from './BookingCard';
import { Booking } from '@/types/booking';
import Link from 'next/link';

const BookingList = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setLoading(true);
      
     
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setBookings([]);
        setLoading(false);
        return;
      }
    
      const userData = JSON.parse(storedUser);
      const userEmail = userData.email;
    
      const storedBookings = localStorage.getItem('bookings');
      if (storedBookings) {
        const parsedBookings = JSON.parse(storedBookings);
        
        const userBookings = parsedBookings.filter((booking: Booking) => booking.userId === userEmail);
        setBookings(userBookings);
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
      alert('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

 
  const handleDeleteBooking = (bookingId: string) => {
    try {
     
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        alert('You must be logged in to delete bookings');
        return;
      }
      const userData = JSON.parse(storedUser);
      const userEmail = userData.email;
      
      
      const updatedUserBookings = bookings.filter(booking => booking.id !== bookingId);
      setBookings(updatedUserBookings);
      
     
      const allStoredBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const updatedAllBookings = allStoredBookings.filter((booking: Booking) => 
       
        booking.id !== bookingId || booking.userId !== userEmail
      );
      
      localStorage.setItem('bookings', JSON.stringify(updatedAllBookings));
    } catch (err) {
      console.error('Error deleting booking:', err);
      alert('Failed to delete booking. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-blue"></div>
    </div>
  );

  if (bookings.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">No Bookings Yet</h2>
        <p className="text-gray-600 mb-6">You don&apos;t have any bookings yet.</p>
        <Link href="/" className="bg-custom-blue text-white px-6 py-2 rounded-md hover:bg-blue-800 transition-colors inline-block">
          Explore Venues
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8" id="bookings">
     
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto ">
        {bookings.map((booking) => (
          <BookingCard 
            key={booking.id} 
            booking={booking} 
            onDelete={() => handleDeleteBooking(booking.id)} 
          />
        ))}
      </div>
    </div>
  );
};

export default BookingList;
