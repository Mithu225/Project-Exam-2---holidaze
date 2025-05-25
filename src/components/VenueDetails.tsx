"use client";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
  addMonths,
} from "date-fns";
import { useVenue } from "@/hooks/useVenue";
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
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

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

  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guests, setGuests] = useState<number>(1);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [nights, setNights] = useState<number>(0);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [isOwner, setIsOwner] = useState<boolean>(false);

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

  const isDateInRange = useCallback(
    (date: Date) => {
      if (selectedDates.length !== 2) return false;

      const start = new Date(selectedDates[0]);
      const end = new Date(selectedDates[1]);

      const rangeStart = start <= end ? start : end;
      const rangeEnd = start <= end ? end : start;

      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      return date >= rangeStart && date <= rangeEnd;
    },
    [selectedDates]
  );

  const handleDateClick = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");

    const checkRangeForBookings = (start: string, end: string) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const range = generateDateRange(startDate, endDate);
      return range.some((date) =>
        bookedDates.includes(format(date, "yyyy-MM-dd"))
      );
    };

    if (selectedDates.length === 0) {
      setSelectedDates([dateString]);
      setCheckIn(dateString);
    } else if (selectedDates.length === 1) {
      const firstDate = new Date(selectedDates[0]);
      const secondDate = date;

      if (firstDate <= secondDate) {
        if (checkRangeForBookings(selectedDates[0], dateString)) {
          alert(
            "Some dates in this range are already booked. Please select different dates."
          );
          return;
        }
        setSelectedDates([selectedDates[0], dateString]);
        setCheckOut(dateString);
      } else {
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
      setSelectedDates([dateString]);
      setCheckIn(dateString);
      setCheckOut("");
    }
  };

  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
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
      const result = await makeBooking(checkIn, checkOut, guests);

      if (!result.success) {
        throw new Error(result.error);
      }

      setCheckIn("");
      setCheckOut("");
      setGuests(1);
      setIsCalendarOpen(false);
      setSelectedDates([]);

      alert("Booking successful!");

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

    const startDay = monthStart.getDay();
    const endDay = monthEnd.getDay();

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

    const allDays = [...prevMonthDays, ...days, ...nextMonthDays];

    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-center text-base">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="grid grid-cols-7 gap-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground p-2"
              >
                {day}
              </div>
            ))}

            {allDays.map((day) => {
              const dateString = format(day, "yyyy-MM-dd");
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isBooked = bookedDates.includes(dateString);
              const isPastDate = isBefore(day, startOfDay(new Date()));
              const isSelected = selectedDates.includes(dateString);
              const isInRange = isDateInRange(day);
              const isDisabled = isPastDate || isBooked;

              return (
                <div
                  key={dateString}
                  className={cn(
                    "text-center rounded-md p-2 text-sm cursor-pointer",
                    !isCurrentMonth && "text-muted-foreground/50",
                    isDisabled && "cursor-not-allowed opacity-50 line-through",
                    isSelected &&
                      !isDisabled &&
                      "bg-custom-blue text-white font-medium",
                    isInRange &&
                      !isSelected &&
                      !isDisabled &&
                      "bg-custom-blue/20 text-custom-blue",
                    !isSelected && !isInRange && !isDisabled && "hover:bg-muted"
                  )}
                  onClick={() => {
                    if (!isDisabled) {
                      handleDateClick(day);
                    }
                  }}
                >
                  {format(day, "d")}
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-xs pt-2"></CardFooter>
      </Card>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (!venue || !venue.owner) return;

    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      const user = JSON.parse(storedUser);

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

  useEffect(() => {
    if (venue) {
      document.title = `${venue.name} | Holidaze`;
    } else {
      document.title = "Venue Details | Holidaze";
    }
  }, [venue]);

  if (loading) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error loading venue</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button
            onClick={refreshVenue}
            variant="outline"
            className="mt-4 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        <Alert>
          <AlertTitle>Venue not found</AlertTitle>
          <AlertDescription>
            The venue you are looking for may have been removed.
          </AlertDescription>
          <Button
            onClick={() => router.push("/")}
            variant="customBlue"
            className="mt-4"
          >
            Return to Venues
          </Button>
        </Alert>
      </div>
    );
  }

  const venueImage =
    venue?.media && venue.media.length > 0
      ? venue.media[0]
      : { url: "/asset/placeholder-venue.jpg", alt: "No image available" };

  return (
    <>
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="flex items-center gap-2 text-custom-blue"
          >
            <ArrowLeft size={16} />
            Back
          </Button>

          <Button
            onClick={refreshVenue}
            variant="ghost"
            className={`flex items-center text-custom-blue gap-2 ${
              isRefreshing ? "opacity-50" : ""
            }`}
            disabled={isRefreshing}
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
              <Image
                src={venueImage.url}
                alt={venueImage.alt}
                fill
                className="object-cover"
              />
            </div>

            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-custom-blue break-words break-all">
                  {venue.name}
                </h1>
                <div className="flex items-center">
                  {renderStars(venue.rating || 0)}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {venue.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <p className="text-custom-orange text-lg font-semibold">
                {formatPrice(venue.price)} per night
              </p>
            </div>

            {isOwner && (
              <div>
                <Button
                  onClick={() => router.push(`/venues/edit/${venue.id}`)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit This Venue
                </Button>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>About This Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="break-words">{venue.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Facilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {venue.meta?.wifi && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="flex justify-center items-center w-8 h-8 bg-custom-blue/10 rounded-full">
                        <Wifi className="w-4 h-4 text-custom-blue" />
                      </div>
                      <span className="font-medium">WiFi</span>
                    </div>
                  )}
                  {venue.meta?.parking && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="flex justify-center items-center w-8 h-8 bg-custom-blue/10 rounded-full">
                        <Car className="w-4 h-4 text-custom-blue" />
                      </div>
                      <span className="font-medium">Parking</span>
                    </div>
                  )}
                  {venue.meta?.breakfast && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="flex justify-center items-center w-8 h-8 bg-custom-blue/10 rounded-full">
                        <Coffee className="w-4 h-4 text-custom-blue" />
                      </div>
                      <span className="font-medium">Breakfast</span>
                    </div>
                  )}
                  {venue.meta?.pets && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="flex justify-center items-center w-8 h-8 bg-custom-blue/10 rounded-full">
                        <PawPrint className="w-4 h-4 text-custom-blue" />
                      </div>
                      <span className="font-medium">Pets</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="flex justify-center items-center w-8 h-8 bg-custom-blue/10 rounded-full">
                      <Users className="w-4 h-4 text-custom-blue" />
                    </div>
                    <span className="font-medium">
                      {venue.maxGuests} Guests
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  {venue.location?.address && (
                    <div className="flex flex-col">
                      <dt className="text-sm font-medium text-muted-foreground">
                        Address
                      </dt>
                      <dd className="break-words">{venue.location.address}</dd>
                    </div>
                  )}
                  {venue.location?.city && (
                    <div className="flex flex-col">
                      <dt className="text-sm font-medium text-muted-foreground">
                        City
                      </dt>
                      <dd className="break-words">{venue.location.city}</dd>
                    </div>
                  )}
                  {venue.location?.country && (
                    <div className="flex flex-col">
                      <dt className="text-sm font-medium text-muted-foreground">
                        Country
                      </dt>
                      <dd className="break-words">{venue.location.country}</dd>
                    </div>
                  )}
                  {venue.location?.zip && (
                    <div className="flex flex-col">
                      <dt className="text-sm font-medium text-muted-foreground">
                        Zip Code
                      </dt>
                      <dd className="break-words">{venue.location.zip}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>

          <div className="lg:self-start lg:sticky lg:top-24">
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle>Reserve This Venue</CardTitle>
                <CardDescription className="flex items-center">
                  <span className="font-semibold text-lg text-custom-orange mr-2">
                    {formatPrice(venue.price)}
                  </span>
                  <span className="text-muted-foreground">per night</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label htmlFor="dates">Check-in / Check-out</Label>
                  <Button
                    id="dates"
                    variant="outline"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="w-full justify-between h-auto py-3"
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                      <span>
                        {checkIn && checkOut
                          ? (() => {
                              const startDate = new Date(checkIn);
                              const endDate = new Date(checkOut);

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
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        isCalendarOpen ? "rotate-90" : ""
                      }`}
                    />
                  </Button>

                  {isCalendarOpen && (
                    <div className="mt-2">{renderCalendar()}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guests">Guests</Label>
                  <select
                    id="guests"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {[...Array(venue.maxGuests)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>

                {checkIn && checkOut && (
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex justify-between mb-2 text-sm">
                      <span>
                        {formatPrice(venue.price)} × {nights} nights
                      </span>
                      <span>{formatPrice(venue.price * nights)}</span>
                    </div>
                    <div className="border-t border-border pt-4 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-custom-orange">
                        {formatPrice(venue.price * nights)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleReservation}
                  disabled={!canReserve()}
                  variant="customBlue"
                  className="w-full h-auto py-3 text-white mt-2"
                >
                  {canReserve() ? "Reserve" : "Select dates to reserve"}
                </Button>

                {!canReserve() && (
                  <div className="flex items-start text-xs text-destructive mt-2">
                    <Info className="w-4 h-4 mr-1 flex-shrink-0 mt-0" />
                    <span>
                      Please select check-in and check-out dates to proceed with
                      reservation.
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col pt-0">
                <div className="w-full p-3 bg-slate-50 rounded-md text-sm">
                  <h4 className="font-semibold text-sm mb-2">
                    Important Information
                  </h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground inline-block"></span>
                      Check-in time is 3:00 PM
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground inline-block"></span>
                      Check-out time is 11:00 AM
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground inline-block"></span>
                      No smoking inside the venue
                    </li>
                  </ul>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
