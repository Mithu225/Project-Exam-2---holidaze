"use client";
import Image from "next/image";
import { Booking } from "@/types/booking";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  Trash2,
  CreditCard,
  PlusIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface BookingCardProps {
  booking: Booking;
  onDelete: () => void;
}

const BookingCard = ({ booking, onDelete }: BookingCardProps) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-US", {
      style: "currency",
      currency: "NOK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const calculateTotalPrice = () => {
    if (!booking.venue || typeof booking.venue === "string") {
      console.warn("Venue information not available for booking:", booking.id);
      return 0;
    }

    const checkInDate = new Date(booking.dateFrom);
    const checkOutDate = new Date(booking.dateTo);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nightCount = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const price = booking.venue.price || 0;
    return nightCount * price;
  };

  const totalPrice = calculateTotalPrice();

  const venueImage =
    booking.venue &&
    typeof booking.venue === "object" &&
    booking.venue.media &&
    booking.venue.media.length > 0
      ? booking.venue.media[0]
      : { url: "/asset/placeholder-venue.jpg", alt: "No image available" };

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
        <h3 className="text-lg font-semibold text-custom-blue">
          {booking.venue && typeof booking.venue === "object"
            ? booking.venue.name
            : "Venue Name Not Available"}
        </h3>
        <p className="mt-1 text-sm text-custom-gray line-clamp-2">
          {booking.venue && typeof booking.venue === "object"
            ? booking.venue.description
            : "No description available"}
        </p>

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
            <span>
              {booking.guests} guest{booking.guests !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 text-custom-blue mr-2" />
              <span className="text-sm font-medium">Total Price:</span>
            </div>
            <span className="text-lg font-bold text-custom-blue">
              {formatPrice(totalPrice)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href="/#venues">
              <Button variant="default" className="w-full">
                <PlusIcon className="w-4 h-4 mr-1" />
                Add New
              </Button>
            </Link>
            <Button
              onClick={(e) => {
                e.preventDefault();
                if (
                  window.confirm(
                    "Are you sure you want to delete this booking?"
                  )
                ) {
                  onDelete();
                }
              }}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
