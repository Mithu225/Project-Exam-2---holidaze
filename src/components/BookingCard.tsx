'use client';
import Image from 'next/image';
import { Booking } from '@/types/booking';
import Link from 'next/link';
import { CalendarDays, Users, Eye, Trash2, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface BookingCardProps {
  booking: Booking;
  onDelete: () => void;
}

const BookingCard = ({ booking, onDelete }: BookingCardProps) => {
  
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
  
  
  const calculateTotalPrice = () => {
    const checkInDate = new Date(booking.dateFrom);
    const checkOutDate = new Date(booking.dateTo);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nightCount = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return nightCount * booking.venue.price;
  };
  
  const totalPrice = calculateTotalPrice();

  
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
        
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CalendarDays className="w-4 h-4 text-custom-blue" />
            <span className="font-medium">From:</span>
            <span>{formatDate(booking.dateFrom)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CalendarDays className="w-4 h-4 text-custom-blue" />
            <span className="font-medium">To:</span>
            <span>{formatDate(booking.dateTo)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-custom-blue" />
            <span className="font-medium">Guests:</span>
            <span>{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 text-custom-blue mr-2" />
              <span className="text-sm font-medium">Total Price:</span>
            </div>
            <span className="text-lg font-bold text-custom-blue">{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-end">
           
          </div>
        </div>
        
        <div className="mt-auto pt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Link href="/#venues">
              <button className="w-full flex items-center justify-center bg-custom-blue text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors">
                <Eye className="w-4 h-4 mr-1" />
               Add New
              </button>
            </Link>
            <button 
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm('Are you sure you want to delete this booking?')) {
                  onDelete();
                }
              }}
              className="w-full flex items-center justify-center bg-white border border-custom-orange text-custom-orange py-2 px-3 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
