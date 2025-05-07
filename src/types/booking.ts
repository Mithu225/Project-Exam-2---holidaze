// src/types/booking.ts
export interface Venue {
  id: string;
  name: string;
  description: string;
  media: {
    url: string;
    alt: string;
  }[];
  price: number;
  maxGuests: number;
  rating: number;
  location: {
    address: string;
    city: string;
    country: string;
    continent: string;
    zip?: string;
    lat: number;
    lng: number;
  };
  meta: {
    wifi: boolean;
    parking: boolean;
    breakfast: boolean;
    pets: boolean;
  };
  owner?: {
    name: string;
    email: string;
    avatar?: string;
  };
  bookings?: {
    id: string;
    dateFrom: string;
    dateTo: string;
    guests: number;
    created: string;
    updated?: string;
    customer?: {
      name: string;
      email: string;
      bio?: string | null;
      avatar?: {
        url: string;
        alt: string;
      };
      banner?: {
        url: string;
        alt: string;
      };
    };
  }[];
  created?: string;
  updated?: string;
  _count?: {
    bookings: number;
  };
}

export interface Booking {
  id: string;
  dateFrom: string;
  dateTo: string;
  guests: number;
  created: string;
  updated?: string;
  venue: Venue;
  userId?: string; // User identifier (email) for filtering bookings by user
}
