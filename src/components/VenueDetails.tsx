"use client";
import Image from "next/image";
import {
  Star,
  Wifi,
  Car,
  Coffee,
  PawPrint,
  Users,
  Calendar,
  Info,
  RefreshCw,
  Edit,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
} from "date-fns";
import { useVenue } from "@/hooks/useVenue";

interface VenueDetailsProps {
  venueId: string;
}

export default function VenueDetails({ venueId }: VenueDetailsProps) {
  const router = useRouter();
  const {
    venue,
    loading,
    error,
    isRefreshing,
    bookedDates,
    refreshVenue,
    makeBooking,
  } = useVenue(venueId);

  // Booking states
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guests, setGuests] = useState<number>(1);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [nights, setNights] = useState<number>(0);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Check if current user is the venue owner
  const [isOwner, setIsOwner] = useState<boolean>(false);

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
          className={`h-5 w-5 ${
            i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
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

  const formatPrice = (price?: number): string => {
    if (price === undefined) return "N/A";
    return `${price.toLocaleString("no-NO")} NOK`;
  };

  // Check if a date is within the selected range
  const isDateInRange = useCallback(
    (date: Date) => {
      if (selectedDates.length !== 2) return false;

      const start = new Date(selectedDates[0]);
      const end = new Date(selectedDates[1]);

      // Ensure chronological order
      const rangeStart = start <= end ? start : end;
      const rangeEnd = start <= end ? end : start;

      // Set time to midnight for comparison
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      return date >= rangeStart && date <= rangeEnd;
    },
    [selectedDates]
  );

  // Handle date click in calendar
  const handleDateClick = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");

    // Check if any dates in the potential range are booked
    const checkRangeForBookings = (start: string, end: string) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const range = generateDateRange(startDate, endDate);
      return range.some((date) =>
        bookedDates.includes(format(date, "yyyy-MM-dd"))
      );
    };

    if (selectedDates.length === 0) {
      // First date selected
      setSelectedDates([dateString]);
      setCheckIn(dateString);
    } else if (selectedDates.length === 1) {
      // Second date selected
      const firstDate = new Date(selectedDates[0]);
      const secondDate = date;

      // Ensure chronological order
      if (firstDate <= secondDate) {
        // Check if any dates in the range are booked
        if (checkRangeForBookings(selectedDates[0], dateString)) {
          alert(
            "Some dates in this range are already booked. Please select different dates."
          );
          return;
        }
        setSelectedDates([selectedDates[0], dateString]);
        setCheckOut(dateString);
      } else {
        // Check if any dates in the range are booked
        if (checkRangeForBookings(dateString, selectedDates[0])) {
          alert(
            "Some dates in this range are already booked. Please select different dates."
          );
          return;
        }
        setSelectedDates([dateString, selectedDates[0]]);
        setCheckIn(dateString);
        setCheckOut(selectedDates[0]);
      }
    } else {
      // Start new selection
      setSelectedDates([dateString]);
      setCheckIn(dateString);
      setCheckOut("");
    }
  };

  const prevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const nextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const canReserve = () => {
    return checkIn && checkOut && guests > 0;
  };

  const handleReservation = async () => {
    if (!venue || !checkIn || !checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }

    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!storedUser || !token) {
      alert("Please log in to make a reservation");
      router.push("/login");
      return;
    }

    try {
      console.log("Creating booking with data:", {
        checkIn,
        checkOut,
        guests,
        venueId: venue.id,
      });

      const result = await makeBooking(checkIn, checkOut, guests);

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log("Booking created successfully:", result.data);

      // Clear form
      setCheckIn("");
      setCheckOut("");
      setGuests(1);
      setIsCalendarOpen(false);
      setSelectedDates([]);

      // Show success message
      alert("Booking successful!");

      // Redirect to profile page
      router.push("/profile");
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Failed to save booking. Please try again.");
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get days from previous and next months to fill the calendar grid
    const startDay = monthStart.getDay(); // 0-6 (Sunday-Saturday)
    const endDay = monthEnd.getDay();

    // Previous month days to display
    const prevMonthDays = [];
    if (startDay > 0) {
      const prevMonth = new Date(currentMonth);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevMonthEnd = endOfMonth(prevMonth);

      for (let i = 0; i < startDay; i++) {
        const day = new Date(prevMonthEnd);
        day.setDate(prevMonthEnd.getDate() - (startDay - i - 1));
        prevMonthDays.push(day);
      }
    }

    // Next month days to display
    const nextMonthDays = [];
    if (endDay < 6) {
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      for (let i = 1; i <= 6 - endDay; i++) {
        const day = new Date(nextMonth);
        day.setDate(i);
        nextMonthDays.push(day);
      }
    }

    // Create an array of all days to display in the calendar
    const allDays = [...prevMonthDays, ...days, ...nextMonthDays];

    // Navigation functions for year selection
    const prevYear = () => {
      const newMonth = new Date(currentMonth);
      newMonth.setFullYear(currentMonth.getFullYear() - 1);
      setCurrentMonth(newMonth);
    };

    const nextYear = () => {
      const newMonth = new Date(currentMonth);
      newMonth.setFullYear(currentMonth.getFullYear() + 1);
      setCurrentMonth(newMonth);
    };

    const goToToday = () => {
      setCurrentMonth(new Date());
    };

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <button
              onClick={prevYear}
              className="p-1 hover:bg-gray-100 rounded-full mr-1"
              aria-label="Previous year"
              title="Previous year"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M5.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L1.414 10l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Previous month"
              title="Previous month"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <h3 className="text-lg font-semibold text-gray-800">
            {format(currentMonth, "MMMM yyyy")}
          </h3>

          <div className="flex items-center">
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Next month"
              title="Next month"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={nextYear}
              className="p-1 hover:bg-gray-100 rounded-full ml-1"
              aria-label="Next year"
              title="Next year"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}

          {/* All days in the calendar grid */}
          {allDays.map((day) => {
            const dateString = format(day, "yyyy-MM-dd");
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isBooked = bookedDates.includes(dateString);
            const isPastDate = isBefore(day, startOfDay(new Date()));

            // Check if this date is explicitly selected (check-in or check-out)
            const isSelected = selectedDates.includes(dateString);

            // Check if this date is in the selected range (between check-in and check-out)
            const isInRange = isDateInRange(day);

            // A date is disabled if it's in the past or it's booked
            const isDisabled = isPastDate || isBooked;

            // Determine the appropriate CSS classes based on the date's state
            let dayClasses = "relative p-2 text-center ";

            if (!isCurrentMonth) {
              // For days from adjacent months
              if (isDisabled) {
                dayClasses += "text-gray-300 opacity-40 cursor-not-allowed";
              } else {
                dayClasses +=
                  "text-gray-400 opacity-50 hover:bg-gray-50 cursor-pointer";
              }
            } else if (isDisabled) {
              // All disabled dates (past or booked) have the same appearance
              dayClasses += "text-gray-300 cursor-not-allowed";
            } else if (isSelected) {
              dayClasses += "text-white bg-custom-blue cursor-pointer";
            } else if (isInRange) {
              dayClasses +=
                "text-custom-blue bg-custom-blue bg-opacity-20 cursor-pointer hover:bg-opacity-30";
            } else {
              dayClasses += "text-gray-700 cursor-pointer hover:bg-gray-100";
            }

            return (
              <div
                key={dateString}
                className={dayClasses}
                onClick={() => {
                  // Don't allow interaction with disabled dates
                  if (isDisabled) return;

                  if (!isCurrentMonth) {
                    setCurrentMonth(
                      new Date(day.getFullYear(), day.getMonth(), 1)
                    );
                    setTimeout(() => handleDateClick(day), 10);
                  } else {
                    handleDateClick(day);
                  }
                }}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 cursor-not-allowed"></div>
            <span className="text-sm text-gray-600">
              Unavailable (past or booked)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-custom-blue"></div>
            <span className="text-sm text-gray-600">
              Check-in/Check-out dates
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-custom-blue bg-opacity-20"></div>
            <span className="text-sm text-gray-600">
              Dates in your selected range
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-400 opacity-50"></div>
            <span className="text-sm text-gray-600">
              Adjacent month (clickable)
            </span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={goToToday}
            className="text-sm text-custom-blue hover:underline"
          >
            Go to Current Month
          </button>
        </div>
      </div>
    );
  };

  // Add this useEffect to check ownership
  useEffect(() => {
    if (!venue || !venue.owner) return;

    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      const user = JSON.parse(storedUser);

      // Compare venue owner email with current user email
      if (venue.owner.email === user.email) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    } catch (error) {
      console.error("Error checking venue ownership:", error);
      setIsOwner(false);
    }
  }, [venue]);

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
            className="mt-4 flex items-center bg-custom-blue text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
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
            onClick={() => router.push("/")}
            className="mt-4 bg-custom-blue text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Return to Venues
          </button>
        </div>
      </div>
    );
  }

  const venueImage =
    venue?.media && venue.media.length > 0
      ? venue.media[0]
      : { url: "/asset/placeholder-venue.jpg", alt: "No image available" };

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
          className={`flex items-center text-custom-blue hover:text-blue-700 ${
            isRefreshing ? "opacity-50" : ""
          }`}
          disabled={isRefreshing}
        >
          <RefreshCw
            size={16}
            className={`mr-1 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
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
            <h1 className="text-3xl font-bold text-custom-blue">
              {venue.name}
            </h1>
            <div className="flex">{renderStars(venue.rating || 0)}</div>
          </div>
          <div className="text-custom-orange text-lg font-semibold">
            Price {formatPrice(venue.price)} per night
          </div>

          {isOwner && (
            <div className="mb-6">
              <button
                onClick={() => router.push(`/venues/edit/${venue.id}`)}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Venue
              </button>
            </div>
          )}

          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span>{venue.maxGuests} Guests</span>
            </div>
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
              <div>{venue.location?.address || "Address not provided"}</div>
            </div>
            <div className="mb-2 flex items-start">
              <div className="font-medium w-20">City:</div>
              <div>{venue.location?.city || "City not provided"}</div>
            </div>
            <div className="mb-2 flex items-start">
              <div className="font-medium w-20">Country:</div>
              <div>{venue.location?.country || "Country not provided"}</div>
            </div>
            {venue.location?.zip && (
              <div className="mb-2 flex items-start">
                <div className="font-medium w-20">Zip:</div>
                <div>{venue.location.zip}</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 pb-6">
          <div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-semibold mb-4">Reserve This Venue</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in / Check-out
                </label>
                <button
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
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
                              return `${format(
                                startDate,
                                "MMM d, yyyy"
                              )} - ${format(endDate, "MMM d, yyyy")}`;
                            } else {
                              return `${format(
                                endDate,
                                "MMM d, yyyy"
                              )} - ${format(startDate, "MMM d, yyyy")}`;
                            }
                          })()
                        : "Select dates"}
                    </span>
                  </div>
                </button>

                {isCalendarOpen && (
                  <div className="mt-2 bg-white rounded-md shadow-lg p-4 z-10">
                    {renderCalendar()}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-custom-blue"
                >
                  {[...Array(venue.maxGuests)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? "Guest" : "Guests"}
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
                    <span className="font-bold text-custom-orange">
                      {formatPrice(venue.price * nights)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleReservation}
                disabled={!canReserve()}
                className={`w-full py-3 px-4 rounded-md text-white bg-custom-orange font-medium ${
                  !canReserve()
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-orange-600"
                }`}
              >
                Reserve
              </button>

              {!canReserve() && (
                <div className="mt-2 text-sm text-orange-600 flex items-start">
                  <Info className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                  <span>
                    Please select check-in and check-out dates before reserving.
                  </span>
                </div>
              )}
            </div>

            <div className="bg-custom-blue bg-opacity-10 rounded-lg p-4">
              <h4 className="font-semibold text-custom-blue mb-2">
                Important Information
              </h4>
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
