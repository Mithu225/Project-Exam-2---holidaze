'use client';
import Image from 'next/image';
import { Booking } from '@/types/booking';
import Link from 'next/link';
import { CalendarDays, Users } from 'lucide-react';
import { format } from 'date-fns';

interface BookingCardProps {
  booking: Booking;
}

const BookingCard = ({ booking }: BookingCardProps) => {
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };


  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  
  const venueImage = booking.venue.media && booking.venue.media.length > 0
    ? booking.venue.media[0]
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
        <h3 className="text-lg font-semibold text-custom-blue">{booking.venue.name}</h3>
        <p className="mt-1 text-sm text-custom-gray line-clamp-2">{booking.venue.description}</p>
        
        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
          <div className="flex items-center">
            <CalendarDays className="w-4 h-4 mr-1" />
            <span>{formatDate(booking.dateFrom)} - {formatDate(booking.dateTo)}</span>
          </div>
        </div>
        
        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-custom-blue">{formatPrice(booking.venue.price)}</span>
            <span className="text-sm text-gray-500">per night</span>
          </div>
          <div className="flex items-center">
            {'★'.repeat(Math.floor(booking.venue.rating))}{'☆'.repeat(5-Math.floor(booking.venue.rating))}
          </div>
        </div>
        
        <div className="mt-auto pt-4">
          <Link href={`/booking/${booking.id}`} className="block">
            <button className="w-full bg-custom-blue text-white py-2 rounded-md hover:bg-blue-800 transition-colors">
              View Booking
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
