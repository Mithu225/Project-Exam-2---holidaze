"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Plus, X } from "lucide-react";
import { createVenue } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

// Schema for venue creation form
const venueFormSchema = z.object({
  name: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  maxGuests: z.coerce.number().min(1, "Maximum guests must be at least 1"),
  rating: z.coerce
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot be more than 5"),
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
export type VenueFormValues = z.infer<typeof venueFormSchema>;

const defaultVenueValues: VenueFormValues = {
  name: "",
  description: "",
  price: 0,
  maxGuests: 1,
  rating: 3,
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

interface CreateVenueFormProps {
  isCreatingVenue: boolean;
  onVenueCreated: (venue: unknown) => void;
  onClose: () => void;
}

export default function CreateVenueForm({
  isCreatingVenue,
  onVenueCreated,
  onClose,
}: CreateVenueFormProps) {
  const { toast } = useToast();
  const venueForm = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: defaultVenueValues,
  });

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

  const handleCreateVenue = async (data: VenueFormValues) => {
    try {
      // Get authentication token
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please login to create venues",
          variant: "destructive",
        });
        onClose();
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

      // Use the new createVenue function
      const result = await createVenue(venueData);

      if (!result.success) {
        throw new Error(result.error || "Failed to create venue");
      }

      // Callback to parent
      onVenueCreated(result.data);
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
    }
  };

  return (
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
                <FormLabel>Price per night (NOK)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="Price" {...field} />
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
                  <FormLabel className="font-normal">Parking</FormLabel>
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
                  <FormLabel className="font-normal">Breakfast</FormLabel>
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
                  <FormLabel className="font-normal">Pets allowed</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={venueForm.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Rating</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => field.onChange(star)}
                      className={
                        star <= field.value
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill={star <= field.value ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.036 6.29a1 1 0 00.95.69h6.6c.969 0 1.371 1.24.588 1.81l-5.347 3.89a1 1 0 00-.364 1.118l2.036 6.29c.3.921-.755 1.688-1.54 1.118l-5.347-3.89a1 1 0 00-1.176 0l-5.347 3.89c-.784.57-1.838-.197-1.539-1.118l2.036-6.29a1 1 0 00-.364-1.118l-5.347-3.89c-.783-.57-.38-1.81.588-1.81h6.6a1 1 0 00.95-.69l2.036-6.29z"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="customBlue"
          className="w-full"
          disabled={isCreatingVenue}
        >
          {isCreatingVenue ? "Creating..." : "Create Venue"}
        </Button>
      </form>
    </Form>
  );
}
