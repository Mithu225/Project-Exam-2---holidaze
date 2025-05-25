"use client";
import { useEffect, useState } from "react";
import BookingCard from "./BookingCard";
import { Booking } from "@/types/booking";
import Link from "next/link";
import { fetchWithAuth } from "@/utils/api";

const BookingList = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);

        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          setBookings([]);
          return;
        }

        const userData = JSON.parse(storedUser);
        const userName = userData.name;
        const token = localStorage.getItem("accessToken");

        if (!token) {
          console.error("No access token found");
          return;
        }

        console.log("Fetching bookings for user:", userName);

       
        const response = await fetchWithAuth(
          `https://v2.api.noroff.dev/holidaze/profiles/${userName}/bookings?_venue=true`
        );

        console.log("Response status:", response.status);
        const responseText = await response.text();
        console.log("Raw response:", responseText);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch bookings: ${response.status} ${responseText}`
          );
        }

        const data = JSON.parse(responseText);
        console.log("Parsed bookings data:", data);

        let bookingsData = Array.isArray(data) ? data : data.data || [];

       
        const bookingsWithVenues = await Promise.all(
          bookingsData.map(async (booking: Booking) => {
            try {
            
              if (
                !booking.venue ||
                typeof booking.venue === "string" ||
                !booking.venue.media
              ) {
                console.log(
                  "Fetching complete venue info for booking:",
                  booking.id
                );
                const venueId =
                  typeof booking.venue === "string"
                    ? booking.venue
                    : booking.venue.id;

                const venueResponse = await fetchWithAuth(
                  `https://v2.api.noroff.dev/holidaze/venues/${venueId}`
                );

                if (!venueResponse.ok) {
                  console.error(
                    "Failed to fetch venue details:",
                    await venueResponse.text()
                  );
                  return booking;
                }

                const venueData = await venueResponse.json();
                console.log("Fetched venue data:", venueData);

                return {
                  ...booking,
                  venue: venueData.data,
                };
              }
              return booking;
            } catch (error) {
              console.error("Error fetching venue details:", error);
              return booking;
            }
          })
        );

        console.log("Final bookings with venues:", bookingsWithVenues);
        setBookings(bookingsWithVenues);
      } catch (err) {
        console.error("Error loading bookings:", err);
        alert("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("accessToken");

      if (!storedUser || !token) {
        alert("You must be logged in to delete bookings");
        return;
      }

      
      const response = await fetchWithAuth(
        `https://v2.api.noroff.dev/holidaze/bookings/${bookingId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete booking");
      }

   
      setBookings((prevBookings) =>
        prevBookings.filter((booking) => booking.id !== bookingId)
      );
    } catch (err) {
      console.error("Error deleting booking:", err);
      alert("Failed to delete booking. Please try again.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-blue"></div>
      </div>
    );

  if (bookings.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          No Bookings Yet
        </h2>
        <p className="text-gray-600 mb-6">
          You don&apos;t have any bookings yet.
        </p>
        <Link
          href="/"
          className="bg-custom-blue text-white px-6 py-2 rounded-md hover:bg-blue-800 transition-colors inline-block"
        >
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
