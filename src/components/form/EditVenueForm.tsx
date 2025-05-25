import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useVenueEdit, VenueUpdateData } from "@/hooks/useVenueEdit";
import { Venue } from "@/types/booking";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Trash2, Plus, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema for venue form validation
const venueFormSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  price: z.coerce
    .number()
    .min(1, "Price must be at least 1")
    .max(10000, "Price cannot exceed 10000"),
  maxGuests: z.coerce
    .number()
    .int()
    .min(1, "Max guests must be at least 1")
    .max(100, "Max guests cannot exceed 100"),
  rating: z.coerce
    .number()
    .min(0, "Rating must be at least 0")
    .max(5, "Rating cannot exceed 5")
    .optional(),
  media: z
    .array(
      z.object({
        url: z.string().url("Please enter a valid URL"),
        alt: z.string().optional().default(""),
      })
    )
    .optional(),
  meta: z.object({
    wifi: z.boolean().default(false),
    parking: z.boolean().default(false),
    breakfast: z.boolean().default(false),
    pets: z.boolean().default(false),
  }),
  location: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    continent: z.string().optional(),
    zip: z.string().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
  }),
});

type VenueFormValues = z.infer<typeof venueFormSchema>;

interface EditVenueFormProps {
  venue: Venue;
  onSuccess?: () => void;
}

export default function EditVenueForm({
  venue,
  onSuccess,
}: EditVenueFormProps) {
  const { updateVenue, isLoading, error } = useVenueEdit();
  const { toast } = useToast();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(error);


  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      name: venue.name,
      description: venue.description || "",
      price: venue.price,
      maxGuests: venue.maxGuests,
      rating: venue.rating || 0,
      media: Array.isArray(venue.media) ? venue.media : [],
      meta: {
        wifi: venue.meta?.wifi || false,
        parking: venue.meta?.parking || false,
        breakfast: venue.meta?.breakfast || false,
        pets: venue.meta?.pets || false,
      },
      location: {
        address: venue.location?.address || "",
        city: venue.location?.city || "",
        country: venue.location?.country || "",
        continent: venue.location?.continent || "",
        zip: venue.location?.zip || "",
        lat: venue.location?.lat || undefined,
        lng: venue.location?.lng || undefined,
      },
    },
  });

  
  useEffect(() => {
    setFormError(error);
  }, [error]);

 
  const addMediaField = () => {
    const currentMedia = form.getValues("media") || [];
    form.setValue("media", [...currentMedia, { url: "", alt: "" }]);
  };

 
  const removeMediaField = (index: number) => {
    const currentMedia = form.getValues("media") || [];
    form.setValue(
      "media",
      currentMedia.filter((_, i) => i !== index)
    );
  };


  const onSubmit = async (data: VenueFormValues) => {
    setFormError(null);

    try {
      const result = await updateVenue(venue.id, data as VenueUpdateData);

      if (result.success) {
        toast({
          title: "Success!",
          description: "Venue updated successfully",
        });

        if (onSuccess) {
          onSuccess();
        } else {
      
          router.push("/profile");
        }
      } else {
        setFormError("Failed to update venue. Please try again.");
      }
    } catch (err) {
      console.error("Error in form submission:", err);
      setFormError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {formError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
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
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your venue"
                    className="resize-none min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per night</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={10000} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxGuests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Guests</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating (0-5)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={5} step={0.1} {...field} />
                </FormControl>
                <FormDescription>
                  Optional, leave at 0 for no rating
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <FormLabel className="text-base">Media</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMediaField}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Image
              </Button>
            </div>

            {form.watch("media")?.map((_, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name={`media.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Image URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name={`media.${index}.alt`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Alt text (description)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-center mt-0"
                  onClick={() => removeMediaField(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="font-medium mb-2">Amenties</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="meta.wifi"
                render={({ field }) => (
                  <FormItem className="flex space-x-3 space-y-0 items-center">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      WiFi
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meta.parking"
                render={({ field }) => (
                  <FormItem className="flex space-x-3 space-y-0 items-center">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Parking
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meta.breakfast"
                render={({ field }) => (
                  <FormItem className="flex space-x-3 space-y-0 items-center">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Breakfast
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meta.pets"
                render={({ field }) => (
                  <FormItem className="flex space-x-3 space-y-0 items-center">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Pets Allowed
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium mb-2">Location Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location.zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Post code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/profile")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button variant="customBlue" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Venue
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
