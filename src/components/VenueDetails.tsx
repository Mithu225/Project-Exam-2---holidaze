'use client';
import Image from 'next/image';
import { Venue, Booking } from '@/types/booking';
import { Star, Wifi, Car, Coffee, PawPrint, Users, Calendar, Info } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

interface VenueDetailsProps {
  venueId: string;
}

export default function VenueDetails({ venueId }: VenueDetailsProps) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guests, setGuests] = useState<number>(1);
  const [nights, setNights] = useState<number>(0);
  const [bookedDates, setBookedDates] = useState<{start: Date, end: Date}[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);


  const calculateNights = useCallback(() => {
    if (!checkIn || !checkOut) return 0;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 0;
  }, [checkIn, checkOut]);

  useEffect(() => {
    setNights(calculateNights());
  }, [checkIn, checkOut, calculateNights]);

  
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

  // Load existing bookings for this venue
  useEffect(() => {
    try {
      const storedBookings = localStorage.getItem('bookings');
      if (storedBookings) {
        const allBookings = JSON.parse(storedBookings) as Booking[];
        const venueBookings = allBookings.filter(booking => booking.venue.id === venueId);
        
        // Convert booking dates to date ranges, ensuring entire days are covered
        const bookedDateRanges = venueBookings.map(booking => {
          const start = new Date(booking.dateFrom);
          const end = new Date(booking.dateTo);
          
          // Set hours to ensure full days are covered
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          
          return { start, end };
        });
        
        setBookedDates(bookedDateRanges);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
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

  const getTotalPrice = () => {
    if (!venue) return 0;
    return venue.price * nights;
  };

  // Check if a date is within any of the booked ranges
  const isDateBooked = (date: Date) => {
    return bookedDates.some(range => {
      // Create a new date object at midnight to ensure consistent comparison
      const testDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const rangeStart = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
      const rangeEnd = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate());
      
      // Test if the date is within the range (inclusive of start and end)
      return testDate >= rangeStart && testDate <= rangeEnd;
    });
  };

  // Custom day renderer for the calendar
  const renderDayContents = (day: number, date: Date) => {
    const isBooked = isDateBooked(date);
    return (
      <div className={`${isBooked ? 'text-red-500 line-through bg-red-100 rounded-full' : ''}`}>
        {day}
      </div>
    );
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    if (start) {
      setCheckIn(format(start, 'yyyy-MM-dd'));
    } else {
      setCheckIn("");
    }
    
    if (end) {
      setCheckOut(format(end, 'yyyy-MM-dd'));
    } else {
      setCheckOut("");
    }
  };

  // Function to toggle calendar view
  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  const handleBookNow = async () => {
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }

    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (!storedUser || !token) {
      alert("Please log in to book a venue");
      router.push('/login');
      return;
    }
    
    // Parse user data
    const userData = JSON.parse(storedUser);
    
    // Check if selected dates overlap with any booked dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    const hasOverlap = bookedDates.some(range => {
      return (
        (checkInDate >= range.start && checkInDate <= range.end) || 
        (checkOutDate >= range.start && checkOutDate <= range.end) ||
        (checkInDate <= range.start && checkOutDate >= range.end)
      );
    });
    
    if (hasOverlap) {
      alert("Some of the selected dates are already booked. Please select different dates.");
      return;
    }
    
    try {
      const bookingData = {
        venueId: venue?.id,
        checkIn,
        checkOut,
        guests,
        venueData: {
          id: venue?.id,
          name: venue?.name,
          description: venue?.description,
          price: venue?.price,
          media: venue?.media,
          rating: venue?.rating,
          maxGuests: venue?.maxGuests,
          meta: venue?.meta
        }
      };
      
      // Store booking in localStorage (in a real app, this would be an API call)
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      bookings.push({
        id: `booking-${Date.now()}`,
        dateFrom: checkIn,
        dateTo: checkOut,
        guests: guests,
        venue: bookingData.venueData,
        created: new Date().toISOString(),
        userId: userData.email // Store user identifier with booking
      });
      localStorage.setItem('bookings', JSON.stringify(bookings));
      
      // Update booked dates locally
      setBookedDates([...bookedDates, { start: checkInDate, end: checkOutDate }]);
      
      // Navigate to profile page
      router.push('/profile');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('There was an error creating your booking. Please try again.');
    }
  };

  const handleExploreMore = () => {
    router.push('/');
  };

  const venueImage = venue.media && venue.media.length > 0
    ? venue.media[0]
    : { url: '/asset/placeholder-venue.jpg', alt: 'No image available' };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
       
        <div className="w-full relative h-[400px] mb-6">
          <Image
            src={venueImage.url}
            alt={venueImage.alt}
            fill
            className="object-cover"
          />
        </div>
      
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-custom-blue">{venue.name}</h1>
            <div className="flex">{renderStars(venue.rating)}</div>
          </div>
          <div className="text-custom-orange text-lg font-semibold">Price {formatPrice(venue.price)} per night</div>
        </div>
     
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 pb-6">
     
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{venue.description}</p>
            </div>
            
            <div className="flex items-center mb-4 text-gray-700">
              <Users className="w-5 h-5 mr-2" />
              <span>{venue.maxGuests} Guests</span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Facilities at Venue</h3>
              <div className="flex flex-col gap-2">
                {venue.meta?.wifi && (
                  <span className="inline-flex items-center text-custom-blue">
                    <span className="inline-flex justify-center items-center w-8 h-8 bg-purple-100 rounded-full mr-2">
                      <Wifi className="w-4 h-4" />
                    </span>
                    WiFi
                  </span>
                )}
                {venue.meta?.parking && (
                  <span className="inline-flex items-center text-custom-blue">
                    <span className="inline-flex justify-center items-center w-8 h-8 bg-purple-100 rounded-full mr-2">
                      <Car className="w-4 h-4" />
                    </span>
                    Parking
                  </span>
                )}
                {venue.meta?.breakfast && (
                  <span className="inline-flex items-center text-custom-blue">
                    <span className="inline-flex justify-center items-center w-8 h-8 bg-purple-100 rounded-full mr-2">
                      <Coffee className="w-4 h-4" />
                    </span>
                    Breakfast
                  </span>
                )}
                {venue.meta?.pets && (
                  <span className="inline-flex items-center text-custom-blue">
                    <span className="inline-flex justify-center items-center w-8 h-8 bg-purple-100 rounded-full mr-2">
                      <PawPrint className="w-4 h-4" />
                    </span>
                    Pets allowed
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-500 mt-6">
              Venue created: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            
            <div className="mt-8">
              <button 
                onClick={handleExploreMore}
                className="bg-white border border-custom-blue text-custom-blue py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
              >
                Explore More Venues
              </button>
            </div>
          </div>
          
      
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Select Dates</h3>
                  <button 
                    onClick={toggleCalendar}
                    className="text-custom-blue hover:text-blue-700 flex items-center"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    {isCalendarOpen ? 'Hide Calendar' : 'Show Calendar'}
                  </button>
                </div>
                
                {isCalendarOpen && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2 text-sm text-gray-500">
                      <Info className="w-4 h-4 mr-1 text-custom-blue" />
                      <span>Dates with <span className="text-red-500 line-through">strikethrough</span> are already booked</span>
                    </div>
                    <DatePicker
                      selected={checkIn ? new Date(checkIn) : null}
                      onChange={handleDateChange}
                      startDate={checkIn ? new Date(checkIn) : null}
                      endDate={checkOut ? new Date(checkOut) : null}
                      minDate={new Date()}
                      selectsRange
                      inline
                      monthsShown={1}
                      renderDayContents={renderDayContents}
                      className="border border-gray-200 rounded-md"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Check-in</h3>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={checkIn}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full py-2 pl-8 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Check-out</h3>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={checkOut}
                        min={checkIn || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full py-2 pl-8 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between">
                  <label className="block text-lg font-semibold mb-1">Guests</label>
                  <span className="text-xs text-gray-500 mt-1">(Children count as 1 guest)</span>
                </div>
                <div className="flex">
                  <button 
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-l-md"
                    disabled={guests <= 1}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    value={guests}
                    min="1"
                    max={venue?.maxGuests || 1}
                    onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                    className="w-14 text-center py-1 border-t border-b border-gray-300 focus:outline-none"
                  />
                  <button 
                    onClick={() => setGuests(Math.min(venue?.maxGuests || 10, guests + 1))}
                    className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-r-md"
                    disabled={guests >= (venue?.maxGuests || 10)}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <button 
                onClick={handleBookNow} 
                className="w-full bg-custom-blue text-white py-3 px-6 rounded-md hover:bg-purple-700 transition-colors text-center font-medium"
              >
                BOOK NOW
              </button>
              
              <div className="flex justify-between items-center mt-4 text-sm">
                <span>{formatPrice(venue?.price || 0)} x {nights} nights</span>
                <span>{formatPrice((venue?.price || 0) * nights)}</span>
              </div>
              
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 font-semibold">
                <span>Total</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
