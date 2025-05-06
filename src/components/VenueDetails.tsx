'use client';
import Image from 'next/image';
import { Venue } from '@/types/booking';
import { Star, Wifi, Car, Coffee, PawPrint, Users, Calendar, Info, RefreshCw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

interface VenueDetailsProps {
  venueId: string;
}

export default function VenueDetails({ venueId }: VenueDetailsProps) {
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Booking states
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guests, setGuests] = useState<number>(1);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [nights, setNights] = useState<number>(0);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);

  // Helper function to generate date range
  const generateDateRange = useCallback((start: Date, end: Date): Date[] => {
    const dates: Date[] = [];
    const current = new Date(start);
    const endDate = new Date(end);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, []);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-5 w-5 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
        />
      );
    }
    return stars;
  };

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

  // Manual refresh function with visual feedback
  const refreshVenue = async () => {
    setIsRefreshing(true);
    try {
      await fetchVenue(true);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500); // Minimum feedback time
    }
  };

  // Function to fetch venue data with reliable cache busting
  const fetchVenue = useCallback(async (bypassCache = true) => {
    setLoading(true);
    setError(null);
    
    try {
      // First check if this is a local venue (with temp- ID)
      if (venueId && venueId.startsWith('temp-')) {
        // Check localStorage for the venue
        const userVenues = localStorage.getItem('userVenues');
        if (userVenues) {
          // Always parse fresh from localStorage to get latest data
          const parsedVenues = JSON.parse(userVenues);
          const localVenue = parsedVenues.find((v: Venue) => v.id === venueId);
          
          if (localVenue) {
            setVenue(localVenue);
            setLoading(false);
            return; // Exit early since we found the venue
          }
        }
      }
      
      // If not found in localStorage or not a local venue, try the API
      // Add timestamp for cache busting
      let apiUrl = `https://v2.api.noroff.dev/holidaze/venues/${venueId}`;
      
      if (bypassCache) {
        const timestamp = Date.now();
        apiUrl += `?_=${timestamp}`;
      }
      
      const response = await fetch(apiUrl, {
        cache: 'no-store', // Tell fetch to always get fresh data
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch venue: ${response.statusText}`);
      }
      
      const data = await response.json();
      const apiVenue = data.data;
      
      // Process owner information
      if (apiVenue) {
        // Extract owner information from API response
        if (typeof apiVenue.owner === 'string') {
          apiVenue.owner = {
            name: apiVenue.owner,
            email: '',
            avatar: ''
          };
        }
        
        setVenue(apiVenue);
      } else {
        throw new Error('No venue data received');
      }
    } catch (error) {
      console.error('Error fetching venue:', error);
      const errorMessage = 'Failed to fetch venue data';
      
      // Try to find venue in localStorage as fallback
      try {
        const userVenues = localStorage.getItem('userVenues');
        if (userVenues) {
          const parsedVenues = JSON.parse(userVenues);
          const localVenue = parsedVenues.find((v: Venue) => v.id === venueId);
          
          if (localVenue) {
            setVenue(localVenue);
            setLoading(false);
            return; // Exit early since we found the venue
          }
        }
      } catch (localError) {
        console.error('Error checking localStorage for venue:', localError);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [venueId]); // Add venueId as a dependency since it's used inside the callback

  useEffect(() => {
    // Call fetchVenue when component mounts or venueId changes
    fetchVenue(true); // true = bypassCache
    
    // Clear any cached data
    sessionStorage.removeItem('venueCache');
    localStorage.removeItem('venueCache');
  }, [venueId, fetchVenue]); // Re-run when venueId or fetchVenue changes

  // Load booked dates when component mounts or venueId changes
  useEffect(() => {
    const loadBookedDates = () => {
      try {
        const storedBookings = localStorage.getItem('bookings');
        if (!storedBookings) {
          setBookedDates([]);
          return;
        }

        const bookings = JSON.parse(storedBookings);
        const dates: Date[] = [];

        bookings.forEach((booking: { venue: { id: string }, dateFrom: string, dateTo: string }) => {
          if (booking.venue.id === venueId) {
            const startDate = new Date(booking.dateFrom);
            const endDate = new Date(booking.dateTo);

            // Make sure dates are valid
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
              const dateRange = generateDateRange(startDate, endDate);
              dates.push(...dateRange);
            }
          }
        });

        console.log('Loaded booked dates:', dates); // Debug log
        setBookedDates(dates);
      } catch (err) {
        console.error('Error loading booked dates:', err);
        setBookedDates([]);
      }
    };

    loadBookedDates();
  }, [venueId, generateDateRange]);

  const formatPrice = (price?: number): string => {
    if (price === undefined) return 'N/A';
    return `${price.toLocaleString('no-NO')} NOK`;
  };

  // Handle date range selection for check-in and check-out
  const handleDateChange = (range: [Date | null, Date | null]) => {
    console.log('Date range selected:', range); // Debug log
    
    if (range[0] && range[1]) {
      // Both dates selected - ensure chronological order
      const startDate = range[0];
      const endDate = range[1];
      
      // Always save dates in chronological order (earlier date as check-in)
      if (startDate <= endDate) {
        setCheckIn(format(startDate, 'yyyy-MM-dd'));
        setCheckOut(format(endDate, 'yyyy-MM-dd'));
      } else {
        // If user selected dates in reverse order, swap them
        setCheckIn(format(endDate, 'yyyy-MM-dd'));
        setCheckOut(format(startDate, 'yyyy-MM-dd'));
      }
    } else {
      // Handle partial selection
      if (range[0]) {
        const formattedDate = format(range[0], 'yyyy-MM-dd');
        setCheckIn(formattedDate);
        console.log('Set check-in date:', formattedDate);
      } else {
        setCheckIn("");
      }
      
      if (range[1]) {
        const formattedDate = format(range[1], 'yyyy-MM-dd');
        setCheckOut(formattedDate);
        console.log('Set check-out date:', formattedDate);
      } else if (!range[0]) {
        // Only clear check-out if explicitly clearing the range
        setCheckOut("");
      }
    }
  };

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  const canReserve = () => {
    return checkIn && checkOut && guests > 0;
  };

  const handleReservation = async () => {
    if (!canReserve()) return;
    
    try {
      if (!venue) return;

      // Get current user info
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        throw new Error('You must be logged in to make a booking');
      }
      const userData = JSON.parse(storedUser);
      
      // Create a new booking with complete venue information
      const booking = {
        id: `booking-${Date.now()}`,
        dateFrom: checkIn,
        dateTo: checkOut,
        guests: guests,
        userId: userData.email, // Add userId to the booking
        venue: {
          id: venue.id,
          name: venue.name,
          description: venue.description,
          price: venue.price,
          rating: venue.rating,
          maxGuests: venue.maxGuests,
          media: venue.media,
          location: venue.location,
          meta: venue.meta
        },
      };
      
      // Store the booking in localStorage using the correct key
      const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      existingBookings.push(booking);
      localStorage.setItem('bookings', JSON.stringify(existingBookings));
      
      // Update booked dates
      setBookedDates([...bookedDates, ...generateDateRange(new Date(checkIn), new Date(checkOut))]);
      
      // Show success message
      alert('Booking successful!');
      
      // Redirect to profile page
      router.push('/profile');
    } catch (err) {
      console.error('Error creating booking:', err);
      alert('Failed to create booking. Please try again.');
    }
  };



  // Render loading, error or content
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-blue"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error loading venue</p>
          <p>{error}</p>
          <button 
            onClick={refreshVenue}
            className="mt-4 flex items-center bg-custom-blue text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!venue) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p>Venue not found. It may have been removed.</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-custom-blue text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Return to Venues
          </button>
        </div>
      </div>
    );
  }

  const venueImage = venue?.media && venue.media.length > 0
    ? venue.media[0]
    : { url: '/asset/placeholder-venue.jpg', alt: 'No image available' };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => router.back()}
          className="text-custom-blue hover:underline flex items-center"
        >
          &larr; Back
        </button>
        
        <button 
          onClick={refreshVenue}
          className={`flex items-center text-custom-blue hover:text-blue-700 ${isRefreshing ? 'opacity-50' : ''}`}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
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
            <div className="flex">{renderStars(venue.rating || 0)}</div>
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
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Location</h3>
              <div className="mb-2 flex items-start">
                <div className="font-medium w-20">Address:</div>
                <div>{venue.location?.address || 'Address not provided'}</div>
              </div>
              <div className="mb-2 flex items-start">
                <div className="font-medium w-20">City:</div>
                <div>{venue.location?.city || 'City not provided'}</div>
              </div>
              <div className="mb-2 flex items-start">
                <div className="font-medium w-20">Country:</div>
                <div>{venue.location?.country || 'Country not provided'}</div>
              </div>
              {venue.location?.zip && (
                <div className="mb-2 flex items-start">
                  <div className="font-medium w-20">Zip:</div>
                  <div>{venue.location.zip}</div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-semibold mb-4">Reserve This Venue</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in / Check-out</label>
                <button 
                  onClick={toggleCalendar}
                  className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-md px-3 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-custom-blue"
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span>
                      {checkIn && checkOut
                        ? (() => {
                            // Ensure dates are displayed in chronological order
                            const startDate = new Date(checkIn);
                            const endDate = new Date(checkOut);
                            
                            // If dates are in wrong order, swap them for display
                            if (startDate <= endDate) {
                              return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
                            } else {
                              return `${format(endDate, 'MMM d, yyyy')} - ${format(startDate, 'MMM d, yyyy')}`;
                            }
                          })()
                        : 'Select dates'}
                    </span>
                  </div>
                </button>
                
                {isCalendarOpen && (
                  <div className="mt-2 bg-white rounded-md shadow-lg p-4 z-10">
                    <DatePicker
                      selected={checkIn ? new Date(checkIn) : null}
                      onChange={handleDateChange}
                      startDate={checkIn ? new Date(checkIn) : null}
                      endDate={checkOut ? new Date(checkOut) : null}
                      selectsRange
                      inline
                      monthsShown={2}
                      minDate={new Date()}
                      excludeDates={bookedDates}
                      className="w-full"
                      dayClassName={date => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        if (date < today) {
                          return 'text-gray-300 line-through'; // Past dates
                        }
                        
                        const isBooked = bookedDates.some(bookedDate => 
                          date.getFullYear() === bookedDate.getFullYear() &&
                          date.getMonth() === bookedDate.getMonth() &&
                          date.getDate() === bookedDate.getDate()
                        );
                        
                        if (isBooked) {
                          return 'text-red-500 line-through bg-red-100'; // Booked dates
                        }
                        
                        return undefined; // Available dates
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-custom-blue"
                >
                  {[...Array(venue.maxGuests)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
              
              {checkIn && checkOut && (
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Price per night</span>
                    <span>{formatPrice(venue.price)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Nights</span>
                    <span>{nights}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-custom-orange">{formatPrice(venue.price * nights)}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleReservation}
                disabled={!canReserve()}
                className={`w-full py-3 px-4 rounded-md text-white bg-custom-orange font-medium ${!canReserve() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'}`}
              >
                Reserve
              </button>
              
              {!canReserve() && (
                <div className="mt-2 text-sm text-orange-600 flex items-start">
                  <Info className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                  <span>Please select check-in and check-out dates before reserving.</span>
                </div>
              )}
            </div>
            
            <div className="bg-custom-blue bg-opacity-10 rounded-lg p-4">
              <h4 className="font-semibold text-custom-blue mb-2">Important Information</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                <li>Check-in time is 3:00 PM</li>
                <li>Check-out time is 11:00 AM</li>
                <li>No smoking policy inside venues</li>
                <li>Quiet hours between 10:00 PM - 7:00 AM</li>
              </ul>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
