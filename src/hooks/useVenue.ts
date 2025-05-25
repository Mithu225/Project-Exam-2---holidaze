import { useState, useEffect, useCallback } from "react";
import { fetchVenueDetails, createBooking } from "@/utils/api";
import { Venue, Booking } from "@/types/booking";
import { format } from "date-fns";


const generateDateRange = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

interface BookingResult {
  success: boolean;
  error?: string;
  data?: Booking;
}

export function useVenue(venueId: string) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  // Process bookings to get booked dates
  const processBookedDates = useCallback((venueData: Venue) => {
    if (venueData?.bookings && Array.isArray(venueData.bookings)) {
      console.log("Processing bookings:", venueData.bookings);
      const allBookedDates: string[] = [];

      venueData.bookings.forEach((booking, index) => {
        console.log(`Processing booking ${index}:`, booking);
        if (booking.dateFrom && booking.dateTo) {
          const startDate = new Date(booking.dateFrom);
          const endDate = new Date(booking.dateTo);
          console.log(
            `Booking dates: ${format(startDate, "yyyy-MM-dd")} to ${format(
              endDate,
              "yyyy-MM-dd"
            )}`
          );

          const dateRange = generateDateRange(startDate, endDate);
          const dateStrings = dateRange.map((date) =>
            format(date, "yyyy-MM-dd")
          );
          console.log(
            `Generated ${dateStrings.length} dates in range:`,
            dateStrings
          );
          allBookedDates.push(...dateStrings);
        }
      });

      console.log("All booked dates:", allBookedDates);
      setBookedDates(allBookedDates);
    } else {
      console.log("No bookings found in venue data:", venueData);
    }
  }, []);


  const fetchVenue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchVenueDetails(venueId);

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setVenue(result.data);
        processBookedDates(result.data);
      } else {
        setError("Failed to fetch venue data");
      }
    } catch (err) {
      console.error("Error in useVenue hook:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [venueId, processBookedDates]);

  
  const refreshVenue = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchVenue();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500); // Minimum feedback time
    }
  }, [fetchVenue]);

 
  const makeBooking = useCallback(
    async (
      checkIn: string,
      checkOut: string,
      guests: number
    ): Promise<BookingResult> => {
      if (!venue) {
        return { success: false, error: "Venue not available" };
      }

      try {
       
        const formattedCheckIn = format(new Date(checkIn), "yyyy-MM-dd");
        const formattedCheckOut = format(new Date(checkOut), "yyyy-MM-dd");

        const result = await createBooking({
          dateFrom: formattedCheckIn,
          dateTo: formattedCheckOut,
          guests: Number(guests),
          venueId: venue.id,
        });

        if (result.error) {
          return { success: false, error: result.error };
        }

        
        if (result.data) {
          const newBooking = result.data;
          if (newBooking.dateFrom && newBooking.dateTo) {
            const startDate = new Date(newBooking.dateFrom);
            const endDate = new Date(newBooking.dateTo);
            const dateRange = generateDateRange(startDate, endDate);
            const dateStrings = dateRange.map((date) =>
              format(date, "yyyy-MM-dd")
            );
            setBookedDates((prev) => [...prev, ...dateStrings]);
          }
        }

        return { success: true, data: result.data };
      } catch (err) {
        console.error("Error making booking:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to make booking",
        };
      }
    },
    [venue]
  );

  
  useEffect(() => {
    fetchVenue();

  
    sessionStorage.removeItem("venueCache");
    localStorage.removeItem("venueCache");
  }, [venueId, fetchVenue]);

  return {
    venue,
    loading,
    error,
    isRefreshing,
    bookedDates,
    refreshVenue,
    makeBooking,
  };
}
