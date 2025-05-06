import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Loader } from 'lucide-react';

interface VenueFormData {
  name: string;
  description: string;
  media: { url: string; alt: string }[];
  price: number;
  maxGuests: number;
  rating: number;
  meta: {
    wifi: boolean;
    parking: boolean;
    breakfast: boolean;
    pets: boolean;
  };
  location: {
    address: string;
    city: string;
    zip: string;
    country: string;
    continent: string;
    lat: number;
    lng: number;
  };
}

interface ApiResponse {
  data: VenueFormData & { id: string; created: string; updated: string };
  meta: Record<string, any>;
}

export default function EditVenuePage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    description: '',
    media: [{ url: '', alt: '' }],
    price: 0,
    maxGuests: 0,
    rating: 0,
    meta: {
      wifi: false,
      parking: false,
      breakfast: false,
      pets: false,
    },
    location: {
      address: '',
      city: '',
      zip: '',
      country: '',
      continent: '',
      lat: 0,
      lng: 0,
    },
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Fetch venue data when component mounts
  useEffect(() => {
    if (!id) return; // Don't fetch until we have an ID
    
    const fetchVenueData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First check if this is a locally created venue (starts with 'temp-')
        if (typeof id === 'string' && id.startsWith('temp-')) {
          // Get user venues from localStorage
          const savedVenues = localStorage.getItem('userVenues');
          if (savedVenues) {
            const userVenues = JSON.parse(savedVenues);
            const venue = userVenues.find((v: any) => v.id === id);
            
            if (venue) {
              // Convert local venue format to form data format
              setFormData({
                name: venue.name,
                description: venue.description,
                media: venue.media || [{ url: '', alt: '' }],
                price: venue.price,
                maxGuests: venue.maxGuests,
                rating: venue.rating,
                meta: {
                  wifi: venue.meta?.wifi || false,
                  parking: venue.meta?.parking || false,
                  breakfast: venue.meta?.breakfast || false,
                  pets: venue.meta?.pets || false,
                },
                location: {
                  address: venue.location?.address || '',
                  city: venue.location?.city || '',
                  zip: venue.location?.zip || '',
                  country: venue.location?.country || '',
                  continent: venue.location?.continent || '',
                  lat: venue.location?.lat || 0,
                  lng: venue.location?.lng || 0,
                },
              });
              setLoading(false);
              return;
            }
          }
        }
        
        // If not a temp venue or not found in localStorage, try the API
        const token = localStorage.getItem('accessToken');
        if (!token) {
          router.push('/login');
          return;
        }
        
        // Use the API endpoint to fetch venue details
        const response = await fetch(`https://v2.api.noroff.dev/holidaze/venues/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch venue (Status: ${response.status})`);
        }
        
        const data = await response.json();
        setFormData(data.data);
      } catch (error) {
        console.error('Error fetching venue:', error);
        setError('Failed to load venue data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVenueData();
  }, [id, router]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof VenueFormData],
          [child]: type === 'checkbox' 
            ? (e.target as HTMLInputElement).checked 
            : type === 'number' ? Number(value) : value
        }
      }));
    } else {
      // Handle top-level properties
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };
  
  // Handle media changes
  const handleMediaChange = (index: number, field: 'url' | 'alt', value: string) => {
    setFormData(prev => {
      const newMedia = [...prev.media];
      newMedia[index] = { ...newMedia[index], [field]: value };
      return { ...prev, media: newMedia };
    });
  };
  
  // Add media item
  const addMediaItem = () => {
    setFormData(prev => ({
      ...prev,
      media: [...prev.media, { url: '', alt: '' }]
    }));
  };
  
  // Remove media item
  const removeMediaItem = (index: number) => {
    if (formData.media.length <= 1) return; // Always keep at least one media item
    
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Check if this is a locally created venue (starts with 'temp-')
      if (typeof id === 'string' && id.startsWith('temp-')) {
        // Update venue in localStorage
        const savedVenues = localStorage.getItem('userVenues');
        if (savedVenues) {
          const userVenues = JSON.parse(savedVenues);
          const updatedVenues = userVenues.map((venue: any) => {
            if (venue.id === id) {
              // Convert form data back to venue format
              return {
                ...venue,
                name: formData.name,
                description: formData.description,
                media: formData.media,
                price: formData.price,
                maxGuests: formData.maxGuests,
                rating: formData.rating,
                meta: formData.meta,
                location: formData.location,
                updated: new Date().toISOString()
              };
            }
            return venue;
          });
          
          localStorage.setItem('userVenues', JSON.stringify(updatedVenues));
          setSuccess(true);
          
          // Redirect back to profile page after a short delay
          setTimeout(() => {
            router.push('/profile');
          }, 1500);
          return;
        }
      }
      
      // If not a temp venue, update via API
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Filter out empty media items
      const cleanedData = {
        ...formData,
        media: formData.media.filter(m => m.url.trim() !== '')
      };
      
      // Make API call to update venue
      const response = await fetch(`https://v2.api.noroff.dev/holidaze/venues/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update venue (Status: ${response.status})`);
      }
      
      setSuccess(true);
      
      // Redirect back to profile page after a short delay
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (error) {
      console.error('Error updating venue:', error);
      setError('Failed to update venue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-blue"></div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Edit Venue | Holidaze</title>
        <meta name="description" content="Edit your venue details" />
      </Head>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Venue</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-green-700">Venue updated successfully!</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Venue Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                  required
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (NOK)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="maxGuests" className="block text-sm font-medium text-gray-700">Max Guests</label>
                  <input
                    type="number"
                    id="maxGuests"
                    name="maxGuests"
                    value={formData.maxGuests}
                    onChange={handleChange}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700">Rating (0-5)</label>
                <input
                  type="number"
                  id="rating"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                />
              </div>
            </div>
          </div>
          
          {/* Media Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Media</h2>
              <button 
                type="button" 
                onClick={addMediaItem}
                className="px-3 py-1 bg-custom-blue text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Add Image
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.media.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-gray-200 rounded-md">
                  <div className="md:col-span-7">
                    <label htmlFor={`media-url-${index}`} className="block text-sm font-medium text-gray-700">Image URL</label>
                    <input
                      type="url"
                      id={`media-url-${index}`}
                      value={item.url}
                      onChange={(e) => handleMediaChange(index, 'url', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div className="md:col-span-4">
                    <label htmlFor={`media-alt-${index}`} className="block text-sm font-medium text-gray-700">Alt Text</label>
                    <input
                      type="text"
                      id={`media-alt-${index}`}
                      value={item.alt}
                      onChange={(e) => handleMediaChange(index, 'alt', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                      placeholder="Description of image"
                    />
                  </div>
                  
                  <div className="md:col-span-1 flex items-end justify-center">
                    <button 
                      type="button" 
                      onClick={() => removeMediaItem(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                      disabled={formData.media.length <= 1}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Amenities */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Amenities</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="wifi"
                  name="meta.wifi"
                  checked={formData.meta.wifi}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      meta: { ...formData.meta, wifi: e.target.checked }
                    });
                  }}
                  className="h-4 w-4 text-custom-blue focus:ring-custom-blue rounded"
                />
                <label htmlFor="wifi" className="ml-2 block text-sm text-gray-700">Wifi</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="parking"
                  name="meta.parking"
                  checked={formData.meta.parking}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      meta: { ...formData.meta, parking: e.target.checked }
                    });
                  }}
                  className="h-4 w-4 text-custom-blue focus:ring-custom-blue rounded"
                />
                <label htmlFor="parking" className="ml-2 block text-sm text-gray-700">Parking</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="breakfast"
                  name="meta.breakfast"
                  checked={formData.meta.breakfast}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      meta: { ...formData.meta, breakfast: e.target.checked }
                    });
                  }}
                  className="h-4 w-4 text-custom-blue focus:ring-custom-blue rounded"
                />
                <label htmlFor="breakfast" className="ml-2 block text-sm text-gray-700">Breakfast</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pets"
                  name="meta.pets"
                  checked={formData.meta.pets}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      meta: { ...formData.meta, pets: e.target.checked }
                    });
                  }}
                  className="h-4 w-4 text-custom-blue focus:ring-custom-blue rounded"
                />
                <label htmlFor="pets" className="ml-2 block text-sm text-gray-700">Pets Allowed</label>
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  id="address"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  id="city"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700">Zip Code</label>
                <input
                  type="text"
                  id="zip"
                  name="location.zip"
                  value={formData.location.zip}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                />
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  id="country"
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="continent" className="block text-sm font-medium text-gray-700">Continent</label>
                <input
                  type="text"
                  id="continent"
                  name="location.continent"
                  value={formData.location.continent}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="lat" className="block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="number"
                  id="lat"
                  name="location.lat"
                  value={formData.location.lat}
                  onChange={handleChange}
                  step="any"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                />
              </div>
              
              <div>
                <label htmlFor="lng" className="block text-sm font-medium text-gray-700">Longitude</label>
                <input
                  type="number"
                  id="lng"
                  name="location.lng"
                  value={formData.location.lng}
                  onChange={handleChange}
                  step="any"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-custom-blue focus:ring-custom-blue"
                />
              </div>
            </div>
          </div>
          
          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/holidaze/venues')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-custom-blue text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
