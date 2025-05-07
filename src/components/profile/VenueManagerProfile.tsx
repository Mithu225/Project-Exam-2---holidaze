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
  X,
  Calendar,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Venue, Booking } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchWithAuth } from "@/utils/api";

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

// Schema for venue creation form
const venueFormSchema = z.object({
  name: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  maxGuests: z.coerce.number().min(1, "Maximum guests must be at least 1"),
  media: z
    .array(
      z.object({
        url: z.string().url("Must be a valid URL"),
        alt: z.string().optional().default(""),
      })
    )
    .optional()
    .default([]),
  location: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    continent: z.string().optional().default("Unknown"),
    lat: z.number().optional().default(0),
    lng: z.number().optional().default(0),
  }),
  meta: z.object({
    wifi: z.boolean().default(false),
    parking: z.boolean().default(false),
    breakfast: z.boolean().default(false),
    pets: z.boolean().default(false),
  }),
});

// Type for the form data
type VenueFormValues = z.infer<typeof venueFormSchema>;

// Default form values
const defaultVenueValues: VenueFormValues = {
  name: "",
  description: "",
  price: 0,
  maxGuests: 1,
  media: [{ url: "", alt: "" }],
  location: {
    address: "",
    city: "",
    country: "",
    zip: "",
    continent: "Unknown",
    lat: 0,
    lng: 0,
  },
  meta: {
    wifi: false,
    parking: false,
    breakfast: false,
    pets: false,
  },
};

export default function VenueManagerProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueBookings, setVenueBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    avatarUrl: "",
  });

  const router = useRouter();
  const { toast } = useToast();

  // Form for creating venues
  const venueForm = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: defaultVenueValues,
  });

  // State for venue creation dialog
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [isCreatingVenue, setIsCreatingVenue] = useState(false);

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
        await fetchManagerVenues();
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

  useEffect(() => {
    if (venues.length > 0) {
      fetchVenueBookings();
    }
  }, [venues]);

  const fetchVenueBookings = async () => {
    try {
      const storedBookings = localStorage.getItem("bookings");
      if (!storedBookings) {
        return;
      }

      const allBookings = JSON.parse(storedBookings) as Booking[];

      // Get all venue IDs owned by this manager
      const managerVenueIds = venues.map((venue) => venue.id);

      // Filter bookings to only those for venues owned by this manager
      const relevantBookings = allBookings.filter((booking) => {
        return managerVenueIds.includes(booking.venue.id);
      });

      // Sort bookings by date (most recent first)
      relevantBookings.sort((a, b) => {
        return new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime();
      });

      setVenueBookings(relevantBookings);
    } catch (error) {
      console.error("Error fetching venue bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load venue bookings",
        variant: "destructive",
      });
    }
  };

  const fetchManagerVenues = async () => {
    try {
      setLoading(true);

      // Get authentication data
      const token = localStorage.getItem("accessToken");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userName = user.name;

      if (!token || !userName) {
        toast({
          title: "Authentication Required",
          description: "Please login to view your venues",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      // Prepare auth token
      // Try to fetch venues from the profile endpoint
      try {
        const profileResponse = await fetchWithAuth(
          `https://v2.api.noroff.dev/holidaze/profiles/${userName}?_venues=true`,
          {
            method: "GET",
          }
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.data?.venues && profileData.data.venues.length > 0) {
            setVenues(profileData.data.venues);
            return;
          }
        } else {
          const errorData = await profileResponse.json();
          const errorMessage =
            errorData.errors?.[0]?.message ||
            errorData.message ||
            `Error: ${profileResponse.status}`;
          console.error("Profile endpoint error:", errorMessage);
        }
      } catch (profileError) {
        console.error("Error fetching from profile endpoint:", profileError);
      }

      // Fallback: fetch all venues, then filter to only show user's venues
      try {
        const allVenuesResponse = await fetch(
          "https://v2.api.noroff.dev/holidaze/venues"
        );

        if (allVenuesResponse.ok) {
          const allVenuesData = await allVenuesResponse.json();

          // Filter venues where the current user is the owner
          const myVenues =
            allVenuesData.data?.filter(
              (venue: {
                owner?: {
                  name: string;
                  email: string;
                };
              }) => {
                if (venue.owner) {
                  return (
                    venue.owner.name === userName ||
                    venue.owner.email === user.email
                  );
                }
                return false;
              }
            ) || [];

          setVenues(myVenues);
        } else {
          const errorData = await allVenuesResponse.json();
          const errorMessage =
            errorData.errors?.[0]?.message ||
            errorData.message ||
            `Error: ${allVenuesResponse.status}`;
          throw new Error(errorMessage);
        }
      } catch (allVenuesError) {
        console.error("Error in fallback fetch:", allVenuesError);
        toast({
          title: "Error Loading Venues",
          description:
            allVenuesError instanceof Error
              ? allVenuesError.message
              : "Failed to load venues",
          variant: "destructive",
        });
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  // Add Venue Form Handlers
  const handleVenueInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    venueForm.setValue(name, value);
  };

  const handleClearInput = (fieldName: string) => {
    venueForm.setValue(fieldName, "");
  };

  const handleAmenityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    venueForm.setValue(`meta.${name}`, checked);
  };

  const handleRatingChange = (value: number) => {
    venueForm.setValue("rating", value);
  };

  const handleDeleteVenue = async (venueId: string) => {
    // Confirm before deleting
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

      // Make API call to delete venue
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

      // Update venues list after deletion
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

  const handleCreateVenue = async (data: VenueFormValues) => {
    setIsCreatingVenue(true);

    try {
      // Get authentication token
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please login to create venues",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      // Ensure we have at least one media item with a valid URL
      const validMedia =
        data.media &&
        data.media.length > 0 &&
        data.media.some((m) => m.url.trim() !== "")
          ? data.media.filter((m) => m.url.trim() !== "")
          : [{ url: "/asset/placeholder-venue.jpg", alt: data.name }];

      // Prepare venue data
      const venueData = {
        ...data,
        media: validMedia,
      };

      // Make API call to create venue
      const response = await fetchWithAuth(
        "https://v2.api.noroff.dev/holidaze/venues",
        {
          method: "POST",
          body: JSON.stringify(venueData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.errors?.[0]?.message ||
          errorData.message ||
          `Failed to create venue: ${response.status}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      // Add the new venue to the list and refresh venues
      setVenues((prevVenues) => [responseData.data, ...prevVenues]);

      // Close the dialog and reset form
      setVenueDialogOpen(false);
      venueForm.reset(defaultVenueValues);

      toast({
        title: "Success!",
        description: "Venue created successfully",
      });
    } catch (error) {
      console.error("Error creating venue:", error);
      toast({
        title: "Error Creating Venue",
        description:
          error instanceof Error ? error.message : "Failed to create venue",
        variant: "destructive",
      });
    } finally {
      setIsCreatingVenue(false);
    }
  };

  // Helper to add a new media field
  const addMediaField = () => {
    const currentMedia = venueForm.getValues("media") || [];
    venueForm.setValue("media", [...currentMedia, { url: "", alt: "" }]);
  };

  // Helper to remove a media field
  const removeMediaField = (index: number) => {
    const currentMedia = venueForm.getValues("media") || [];
    venueForm.setValue(
      "media",
      currentMedia.filter((_, i) => i !== index)
    );
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
    <div className="container max-w-4xl mx-auto px-4 py-8">
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create a New Venue</DialogTitle>
              </DialogHeader>
              <Form {...venueForm}>
                <form
                  onSubmit={venueForm.handleSubmit(handleCreateVenue)}
                  className="space-y-6"
                >
                  <FormField
                    control={venueForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter venue name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={venueForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your venue"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={venueForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per night</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Price"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={venueForm.control}
                      name="maxGuests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Guests</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Max guests"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Media</Label>
                    {venueForm.watch("media")?.map((_, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <FormField
                          control={venueForm.control}
                          name={`media.${index}.url`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="Image URL" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeMediaField(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMediaField}
                      className="mt-1"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Image
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium mb-2">Location Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={venueForm.control}
                        name="location.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Address" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={venueForm.control}
                        name="location.zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Post code" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={venueForm.control}
                        name="location.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={venueForm.control}
                        name="location.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="Country" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Amenities</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={venueForm.control}
                        name="meta.wifi"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">WiFi</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={venueForm.control}
                        name="meta.parking"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Parking
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={venueForm.control}
                        name="meta.breakfast"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Breakfast
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={venueForm.control}
                        name="meta.pets"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Pets allowed
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isCreatingVenue}
                  >
                    {isCreatingVenue ? "Creating..." : "Create Venue"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleEditFormOpen}>
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </div>
      </div>

      {/* Profile Edit Form */}
      {showEditForm && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary">Edit Profile</h2>
            <Button variant="ghost" size="sm" onClick={handleEditFormClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div className="mb-4">
              <Label htmlFor="bio" className="block mb-1">
                Your Bio
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="resize-none"
                rows={3}
                placeholder="Tell us a bit about yourself"
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="avatarUrl" className="block mb-1">
                Avatar URL
              </Label>
              <Input
                type="text"
                id="avatarUrl"
                name="avatarUrl"
                value={formData.avatarUrl}
                onChange={handleInputChange}
                placeholder="Enter avatar image URL"
              />
            </div>

            <div className="flex space-x-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleEditFormClose}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
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
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
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
                <div className="p-4">
                  <h3
                    className="font-semibold text-primary truncate"
                    title={venue.name}
                  >
                    {venue.name}
                  </h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-orange-500 font-medium">
                      NOK {venue.price}
                    </span>
                    <div className="flex text-yellow-500">
                      {"★".repeat(Math.floor(venue.rating || 0))}
                      {"☆".repeat(5 - Math.floor(venue.rating || 0))}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
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

        {venueBookings.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No bookings for your venues yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {venueBookings.map((booking) => (
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
                        {new Date(booking.dateTo).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-2">
                      <span className="font-medium">Guest:</span>{" "}
                      {booking.userId}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Guests:</span>{" "}
                      {booking.guests}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Confirmed
                    </span>
                    <p className="text-sm mt-2 font-medium">
                      Booked on {new Date(booking.created).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
