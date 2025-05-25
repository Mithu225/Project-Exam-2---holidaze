"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  User,
  Mail,
  Edit,
  Plus,
  Home,
  Calendar,
  Trash2,
  Navigation,
  Wifi,
  Car,
  Coffee,
  PawPrint,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Venue, Booking } from "@/types/booking";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { fetchWithAuth } from "@/utils/api";
import CreateVenueForm from "@/components/form/CreateVenueForm";
import ManagerEditProfileForm from "@/components/form/ManagerEditProfileForm";

interface UserData {
  name: string;
  email: string;
  bio?: string;
  avatar?: {
    url: string;
    alt: string;
  };
  banner?: {
    url: string;
    alt: string;
  };
  role?: string;
}

type VenueBooking = {
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
};

export default function VenueManagerProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    avatarUrl: "",
  });

  const router = useRouter();
  const { toast } = useToast();

  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [isCreatingVenue] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!user || !user.name) {
          console.error("No user found in localStorage");
          router.push("/login");
          return;
        }

        setUserData(user);
        await fetchManagerVenues(user.name);
      } catch (error) {
        console.error("Error loading profile data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, toast]);

  const fetchManagerVenues = async (userName: string) => {
    try {
      setLoading(true);
      setBookingsLoading(true);
      setBookingsError(null);

      const token = localStorage.getItem("accessToken");

      if (!token || !userName) {
        toast({
          title: "Authentication Required",
          description: "Please login to view your venues",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      try {
        const profileResponse = await fetchWithAuth(
          `https://v2.api.noroff.dev/holidaze/profiles/${userName}/venues?_bookings=true&sort=created&sortOrder=desc&_owner=true`
        );

        if (profileResponse.ok) {
          const data = await profileResponse.json();
          console.log("Venues with bookings data:", data);

          if (data.data && Array.isArray(data.data)) {
            setVenues(data.data);

            const allBookings: Booking[] = [];
            data.data.forEach((venue: Venue) => {
              if (venue.bookings && Array.isArray(venue.bookings)) {
                venue.bookings.forEach((booking: VenueBooking) => {
                  allBookings.push({
                    ...booking,
                    venue: {
                      id: venue.id,
                      name: venue.name,
                      description: venue.description,
                      media: venue.media,
                      price: venue.price,
                      maxGuests: venue.maxGuests,
                      rating: venue.rating,
                      location: venue.location,
                      meta: venue.meta,
                      owner: venue.owner,
                    },
                  });
                });
              }
            });

            const sortedBookings = allBookings.sort(
              (a, b) =>
                new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime()
            );

            setBookings(sortedBookings);
            setBookingsLoading(false);
          } else {
            setVenues([]);
            setBookings([]);
          }
        } else {
          const errorData = await profileResponse.json();
          const errorMessage =
            errorData.errors?.[0]?.message ||
            errorData.message ||
            `Error: ${profileResponse.status}`;
          throw new Error(errorMessage);
        }
      } catch (profileError) {
        console.error("Error fetching venues with bookings:", profileError);
        setBookingsError(
          profileError instanceof Error
            ? profileError.message
            : "Failed to load bookings"
        );
      }
    } catch (error) {
      console.error("Error in venue fetching process:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load venues",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setBookingsLoading(false);
    }
  };

  const handleEditFormOpen = () => {
    setFormData({
      bio: userData?.bio || "",
      avatarUrl: userData?.avatar?.url || "",
    });
    setShowEditForm(true);
  };

  const handleEditFormClose = () => {
    setShowEditForm(false);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userData) return;

    const updatedUserData = {
      ...userData,
      bio: formData.bio || userData.bio,
      avatar:
        formData.avatarUrl && formData.avatarUrl.trim()
          ? {
              url: formData.avatarUrl.trim(),
              alt: "Venue manager avatar",
            }
          : userData.avatar,
      banner: userData.banner,
      venueManager: true,
    };

    localStorage.setItem("user", JSON.stringify(updatedUserData));
    setUserData(updatedUserData);
    setShowEditForm(false);

    toast({
      title: "Success!",
      description: "Profile updated successfully",
    });
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (!confirm("Are you sure you want to delete this venue?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please login to delete venues",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      const response = await fetchWithAuth(
        `https://v2.api.noroff.dev/holidaze/venues/${venueId}?_owner=true`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.errors?.[0]?.message ||
          errorData.message ||
          `Failed to delete venue: ${response.status}`;
        throw new Error(errorMessage);
      }

      setVenues((prevVenues) =>
        prevVenues.filter((venue) => venue.id !== venueId)
      );

      toast({
        title: "Success!",
        description: "Venue deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting venue:", error);
      toast({
        title: "Error Deleting Venue",
        description:
          error instanceof Error ? error.message : "Failed to delete venue",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">Please log in to view your profile.</p>
        <Button
          variant="default"
          className="mt-4"
          onClick={() => router.push("/login")}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-16 h-16 mr-4 rounded-full overflow-hidden bg-white border-2 border-gray-200">
            {userData.avatar ? (
              <Image
                src={userData.avatar.url}
                alt={userData.avatar.alt || "Avatar"}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-200">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">
                {userData.name}
              </h1>
              <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs font-semibold rounded-full">
                Manager
              </span>
            </div>

            {userData.bio && (
              <div className="mt-3 text-gray-700 max-w-md">
                <span className="font-medium">Bio:</span>{" "}
                <span className="italic">&ldquo;{userData.bio}&rdquo;</span>
              </div>
            )}
            <div className="flex items-center text-muted-foreground mt-1">
              <Mail className="w-4 h-4 mr-1" />
              <span>{userData.email}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <Dialog open={venueDialogOpen} onOpenChange={setVenueDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="customBlue">
                <Plus className="mr-2 h-4 w-4" /> Add Venue
              </Button>
            </DialogTrigger>
            <DialogContent className=" sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-custom-blue text-center">
                  Create a New Venue
                </DialogTitle>
              </DialogHeader>
              <CreateVenueForm
                isCreatingVenue={isCreatingVenue}
                onVenueCreated={(venue: Venue) => {
                  setVenues((prevVenues: Venue[]) => [venue, ...prevVenues]);
                  setVenueDialogOpen(false);
                }}
                onClose={() => setVenueDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleEditFormOpen}>
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </div>
      </div>

      {/* Profile Edit Form */}
      {showEditForm && (
        <ManagerEditProfileForm
          userData={userData}
          formData={formData}
          setFormData={setFormData}
          loading={loading}
          onSubmit={handleProfileSubmit}
          onCancel={handleEditFormClose}
        />
      )}

      {/* Venues Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">My Venues</h2>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Home className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No venues yet
            </h3>
            <p className="text-gray-500 mb-4">
              You haven&apos;t created any venues yet.
            </p>
            <Button onClick={() => setVenueDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Your First Venue
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full"
              >
                <div className="relative h-40 w-full">
                  {venue.media && venue.media.length > 0 ? (
                    <Image
                      src={venue.media[0].url}
                      alt={venue.media[0].alt || venue.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Home className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3
                    className="text-lg font-semibold text-custom-blue truncate"
                    title={venue.name}
                  >
                    {venue.name}
                  </h3>

                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <Navigation className="w-4 h-4 mr-1 flex-shrink-0 text-custom-blue" />
                    <span className="truncate">
                      {venue.location?.city || ""}
                      {venue.location?.city && venue.location?.country
                        ? ", "
                        : ""}
                      {venue.location?.country || "Location not specified"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {venue.meta?.wifi && (
                      <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-custom-blue">
                        <Wifi className="w-3 h-3 mr-1" />
                        WiFi
                      </span>
                    )}
                    {venue.meta?.parking && (
                      <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-custom-blue">
                        <Car className="w-3 h-3 mr-1" />
                        Parking
                      </span>
                    )}
                    {venue.meta?.breakfast && (
                      <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-custom-blue">
                        <Coffee className="w-3 h-3 mr-1" />
                        Breakfast
                      </span>
                    )}
                    {venue.meta?.pets && (
                      <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-custom-blue">
                        <PawPrint className="w-3 h-3 mr-1" />
                        Pets
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-custom-orange">
                        NOK {venue.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">per night</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">
                        {venue.rating?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-1 text-custom-blue" />
                    <span>Up to {venue.maxGuests} guests</span>
                  </div>

                  <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleDeleteVenue(venue.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                    <Link href={`/venues/edit/${venue.id}`} passHref>
                      <Button variant="default" size="sm" className="w-full">
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookings Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Upcoming Bookings for My Venues
        </h2>

        {bookingsLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : bookingsError ? (
          <div className="text-center py-8 bg-red-50 rounded-lg">
            <p className="text-red-500">{bookingsError}</p>
            <Button
              variant="outline"
              onClick={() => userData && fetchManagerVenues(userData.name)}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No bookings for your venues yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const now = new Date();
              const bookingStart = new Date(booking.dateFrom);
              const bookingEnd = new Date(booking.dateTo);

              let status = "Upcoming";
              let statusColor = "bg-blue-100 text-blue-800";

              if (now > bookingEnd) {
                status = "Completed";
                statusColor = "bg-gray-100 text-gray-800";
              } else if (now >= bookingStart && now <= bookingEnd) {
                status = "Active";
                statusColor = "bg-green-100 text-green-800";
              } else if (
                bookingStart.getTime() - now.getTime() <
                7 * 24 * 60 * 60 * 1000
              ) {
                status = "Soon";
                statusColor = "bg-yellow-100 text-yellow-800";
              }

              return (
                <div
                  key={booking.id}
                  className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-primary">
                        {booking.venue.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>
                          {new Date(booking.dateFrom).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}{" "}
                          -{" "}
                          {new Date(booking.dateTo).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <p className="text-sm mt-2">
                        <span className="font-medium">Guest:</span>{" "}
                        {booking.customer?.name ||
                          booking.userId ||
                          "Anonymous"}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Guests:</span>{" "}
                        {booking.guests}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block ${statusColor} text-xs px-2 py-1 rounded`}
                      >
                        {status}
                      </span>
                      <p className="text-sm mt-2 font-medium">
                        Booked on{" "}
                        {new Date(booking.created).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
