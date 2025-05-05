'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { User, Mail, Edit, Plus, Home, X } from 'lucide-react';
import Link from 'next/link';
import { Venue } from '@/types/booking';

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

export default function VenueManagerProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    avatarUrl: ''
  });
  
  // Add venue form state
  const [venueFormData, setVenueFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    price: '',
    maxGuests: '',
    address: '',
    postCode: '',
    city: '',
    country: '',
    rating: 0,
    amenities: {
      wifi: false,
      pets: false,
      parking: false,
      breakfast: false
    }
  });
  const [createVenueLoading, setCreateVenueLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!user || !user.name) {
          console.error('No user found in localStorage');
          router.push('/login');
          return;
        }
        
        setUserData(user);
        await fetchManagerVenues();
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };
    
    fetchData();
  }, [router]);
  
  const fetchManagerVenues = async () => {
    try {
      // First check localStorage for any saved venues
      const savedVenues = localStorage.getItem('userVenues');
      
      if (savedVenues) {
        const parsedVenues = JSON.parse(savedVenues);
        setVenues(parsedVenues);
        console.log('Loaded venues from localStorage:', parsedVenues.length);
      }
      
      // Then try to get venues from API
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userName = user.name;
      
      if (!token || !userName) {
        console.error('Authentication required to fetch venues from API');
        setLoading(false);
        return;
      }
      
      // Try to authenticate with the API
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log(`Fetching venues from API for user: ${userName}`);
      
      // First try to fetch venues specific to the manager profile
      try {
        const profileResponse = await fetch(`https://v2.api.noroff.dev/holidaze/profiles/${userName}?_venues=true`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.data?.venues && profileData.data.venues.length > 0) {
            const apiVenues = profileData.data.venues;
            console.log('API Venues loaded:', apiVenues.length);
            
            // Merge local venues with API venues
            const localVenues = savedVenues ? JSON.parse(savedVenues).filter((v: Venue) => v.id.startsWith('temp-')) : [];
            const mergedVenues = [...apiVenues, ...localVenues];
            
            setVenues(mergedVenues);
            localStorage.setItem('userVenues', JSON.stringify(mergedVenues));
            setLoading(false);
            return;
          }
        }
      } catch (profileError) {
        console.error('Error fetching from profile endpoint:', profileError);
      }
      
      // Fallback: fetch all venues, then filter to only show user's venues
      try {
        console.log('Falling back to fetching all venues...');
        const allVenuesResponse = await fetch('https://v2.api.noroff.dev/holidaze/venues');
        
        if (allVenuesResponse.ok) {
          const allVenuesData = await allVenuesResponse.json();
          
          // Filter venues where the current user is the owner
          const myVenues = allVenuesData.data?.filter((venue: {
            owner?: {
              name: string;
              email: string;
            }
          }) => {
            if (venue.owner) {
              return venue.owner.name === userName || 
                     venue.owner.email === user.email;
            }
            return false;
          }) || [];
          
          console.log('Filtered API venues:', myVenues.length);
          
          // Merge with any locally created venues
          const localVenues = savedVenues ? JSON.parse(savedVenues).filter((v: Venue) => v.id.startsWith('temp-')) : [];
          const mergedVenues = [...myVenues, ...localVenues];
          
          setVenues(mergedVenues);
          localStorage.setItem('userVenues', JSON.stringify(mergedVenues));
        } else {
          console.error('Failed to fetch venues from API');
          
          // If we have local venues, use those
          if (savedVenues) {
            const localVenues = JSON.parse(savedVenues);
            setVenues(localVenues);
          }
        }
      } catch (allVenuesError) {
        console.error('Error in fallback fetch:', allVenuesError);
      }
    } catch (error) {
      console.error('Error in venue fetching process:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFormOpen = () => {
    setFormData({
      bio: userData?.bio || '',
      avatarUrl: userData?.avatar?.url || ''
    });
    setShowEditForm(true);
  };

  const handleEditFormClose = () => {
    setShowEditForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Add Venue Form Handlers
  const handleVenueInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVenueFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleClearInput = (fieldName: string) => {
    setVenueFormData(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  };
  
  const handleAmenityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setVenueFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [name]: checked
      }
    }));
  };
  
  const handleRatingChange = (value: number) => {
    setVenueFormData(prev => ({
      ...prev,
      rating: value
    }));
  };
  
  // Image validation is now handled directly in the form submission
  
  const handleCreateVenue = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateVenueLoading(true);
    
    try {
      // Get username from local storage for owner info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Create a new venue that matches the required interface structure
      const newVenue: Venue = {
        id: `temp-${Date.now()}`,
        name: venueFormData.title,
        description: venueFormData.description,
        price: Number(venueFormData.price),
        maxGuests: Number(venueFormData.maxGuests),
        rating: venueFormData.rating,
        meta: {
          wifi: venueFormData.amenities.wifi,
          parking: venueFormData.amenities.parking,
          breakfast: venueFormData.amenities.breakfast,
          pets: venueFormData.amenities.pets
        },
        location: {
          address: venueFormData.address || 'No address provided',
          city: venueFormData.city || 'No city provided',
          country: venueFormData.country || 'No country provided',
          continent: 'Europe', // Default to Europe
          lat: 0,
          lng: 0
          // Note: zip/postCode is stored in the address field in our UI
        },
        media: venueFormData.imageUrl ? [{
          url: venueFormData.imageUrl,
          alt: `Image of ${venueFormData.title}`
        }] : []
      };
      
      // Add owner information separately to avoid TypeScript errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newVenue as any).owner = user ? {
        name: user.name || 'Current User',
        email: user.email || ''
      } : {
        name: 'Current User',
        email: ''
      };
      
      // Add the new venue to the venues list
      const updatedVenues = [newVenue, ...venues];
      setVenues(updatedVenues);
      
      // Save to localStorage so it persists across page reloads
      localStorage.setItem('userVenues', JSON.stringify(updatedVenues));
      
      // Reset form and close modal
      setVenueFormData({
        title: '',
        description: '',
        imageUrl: '',
        price: '',
        maxGuests: '',
        address: '',
        postCode: '',
        city: '',
        country: '',
        rating: 0,
        amenities: {
          wifi: false,
          pets: false,
          parking: false,
          breakfast: false
        }
      });
      
      setShowAddVenueModal(false);
      alert('Venue created successfully!');
      
    } catch (error) {
      console.error('Error creating venue:', error);
      alert(error instanceof Error ? error.message : 'Failed to create venue');
    } finally {
      setCreateVenueLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData) return;
    
    // Create updated user data with form values
    const updatedUserData = {
      ...userData,
      bio: formData.bio || userData.bio,
      
      // Update avatar if provided, otherwise keep existing
      avatar: formData.avatarUrl && formData.avatarUrl.trim() ? {
        url: formData.avatarUrl.trim(),
        alt: 'Venue manager avatar'
      } : userData.avatar,
      
      // Keep existing banner if any
      banner: userData.banner,
      
      // Ensure we keep venue manager status
      venueManager: true
    };
    
    console.log('Updated user data:', updatedUserData);
    
    // Update local storage (same as GuestProfile does)
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    
    // Update component state
    setUserData(updatedUserData);
    setShowEditForm(false);
    
    // Notify user
    alert('Profile updated successfully!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-blue"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header with Avatar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div className="flex items-center">
          {/* Avatar */}
          <div className="w-16 h-16 mr-4 rounded-full overflow-hidden bg-white border-2 border-gray-200">
            {userData.avatar ? (
              <Image 
                src={userData.avatar.url}
                alt={userData.avatar.alt || 'Avatar'}
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
          
          {/* User Info */}
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-custom-blue">{userData.name}</h1>
              <span className="ml-2 px-2 py-0.5 bg-custom-blue text-white text-xs font-semibold rounded-full">
                Manager
              </span>
            </div>
          
            {userData.bio && (
              <div className="mt-3 text-gray-700 max-w-md">
                <span className="font-medium">Bio:</span> <span className="italic">&ldquo;{userData.bio}&rdquo;</span>
              </div>
              
            )}
              <div className="flex items-center text-custom-gray mt-1">
              <Mail className="w-4 h-4 mr-1" />
              <span>{userData.email}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setShowAddVenueModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-custom-blue hover:bg-blue-700 rounded-md text-white transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Venue
          </button>
          <button 
            onClick={handleEditFormOpen}
            className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Add Venue Modal */}
      {showAddVenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-center text-custom-blue">CREATE A NEW VENUE</h2>
                <button 
                  onClick={() => setShowAddVenueModal(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateVenue}>
                {/* Title */}
                <div className="mb-4 relative">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={venueFormData.title}
                    onChange={handleVenueInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md pr-8"
                    placeholder="Title.."
                    required
                  />
                  <X className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                    onClick={() => handleClearInput('title')} />
                </div>
                
                {/* Description */}
                <div className="mb-4 relative">
                  <textarea
                    id="description"
                    name="description"
                    value={venueFormData.description}
                    onChange={handleVenueInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md pr-8"
                    placeholder="Description.."
                    rows={3}
                    required
                  />
                  <X className="absolute right-3 top-8 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                    onClick={() => handleClearInput('description')} />
                </div>
                
                {/* Image URL */}
                <div className="mb-4 flex gap-2">
                  <div className="flex-grow relative">
                    <input
                      type="text"
                      id="imageUrl"
                      name="imageUrl"
                      value={venueFormData.imageUrl}
                      onChange={handleVenueInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md pr-8"
                      placeholder="New Image URL..."
                    />
                    <X className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                      onClick={() => handleClearInput('imageUrl')} />
                  </div>
                
                </div>
                
                {/* Price and Max Guests */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={venueFormData.price}
                      onChange={handleVenueInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md pr-8"
                      placeholder="Price.."
                      required
                      min="0"
                    />
                    <X className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                      onClick={() => handleClearInput('price')} />
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      id="maxGuests"
                      name="maxGuests"
                      value={venueFormData.maxGuests}
                      onChange={handleVenueInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md pr-8"
                      placeholder="Max guests.."
                      required
                      min="1"
                    />
                    <X className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                      onClick={() => handleClearInput('maxGuests')} />
                  </div>
                </div>
                
                {/* Amenities */}
                <div className="mb-6">
                  <p className="font-medium mb-2">[x] This Venue offers</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="wifi"
                        checked={venueFormData.amenities.wifi}
                        onChange={handleAmenityChange}
                        className="form-checkbox rounded text-custom-blue"
                      />
                      <span>Wifi</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="pets"
                        checked={venueFormData.amenities.pets}
                        onChange={handleAmenityChange}
                        className="form-checkbox rounded text-custom-blue"
                      />
                      <span>Pets</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="parking"
                        checked={venueFormData.amenities.parking}
                        onChange={handleAmenityChange}
                        className="form-checkbox rounded text-custom-blue"
                      />
                      <span>Parking</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="breakfast"
                        checked={venueFormData.amenities.breakfast}
                        onChange={handleAmenityChange}
                        className="form-checkbox rounded text-custom-blue"
                      />
                      <span>Breakfast</span>
                    </label>
                  </div>
                </div>
                
                {/* Location */}
                <div className="mb-6">
                  <p className="font-medium mb-2 text-purple-700">LOCATION</p>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={venueFormData.address}
                        onChange={handleVenueInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md pr-8"
                        placeholder="Address..."
                      />
                      <X className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                        onClick={() => handleClearInput('address')} />
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        id="postCode"
                        name="postCode"
                        value={venueFormData.postCode}
                        onChange={handleVenueInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md pr-8"
                        placeholder="Post code..."
                      />
                      <X className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                        onClick={() => handleClearInput('postCode')} />
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={venueFormData.city}
                        onChange={handleVenueInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md pr-8"
                        placeholder="City..."
                      />
                      <X className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                        onClick={() => handleClearInput('city')} />
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={venueFormData.country}
                        onChange={handleVenueInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md pr-8"
                        placeholder="Country..."
                      />
                      <X className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                        onClick={() => handleClearInput('country')} />
                    </div>
                  </div>
                </div>
                
                {/* Rating */}
                <div className="mb-6">
                  <p className="font-medium mb-2">[x] Select your rating for the venue</p>
                  <div className="flex space-x-8">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value} className="flex items-center space-x-1">
                        <input
                          type="radio"
                          name="rating"
                          value={value}
                          checked={Number(venueFormData.rating) === value}
                          onChange={() => handleRatingChange(value)}
                          className="form-radio text-custom-blue"
                        />
                        <span>{value}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full bg-custom-blue hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                    disabled={createVenueLoading}
                  >
                    {createVenueLoading ? 'Creating...' : 'Create Venue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Profile Form */}
      {showEditForm && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-custom-blue">Edit Profile</h2>
            <button 
              onClick={handleEditFormClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Your Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-blue"
                rows={3}
                placeholder="Tell us a bit about yourself"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Avatar URL
              </label>
              <input
                type="text"
                id="avatarUrl"
                name="avatarUrl"
                value={formData.avatarUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-blue"
                placeholder="Enter avatar image URL"
              />
            </div>
            

            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-custom-blue hover:bg-blue-600 text-white rounded-md transition-colors"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleEditFormClose}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* My Venues Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">My Venues</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-blue"></div>
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Home className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No venues yet</h3>
            <p className="text-gray-500 mb-4">You haven&apos;t created any venues yet.</p>
            <Link href="/holidaze/venues/create" className="inline-flex items-center px-4 py-2 bg-custom-blue text-white rounded-md hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Venue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map(venue => (
              <div key={venue.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
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
                  <h3 className="font-semibold text-custom-blue truncate" title={venue.name}>{venue.name}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-custom-orange font-medium">NOK {venue.price}</span>
                    <div className="flex text-yellow-500">
                      {'★'.repeat(Math.floor(venue.rating))}{'☆'.repeat(5-Math.floor(venue.rating))}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link href={`/venue/${venue.id}`} className="text-center py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors">
                      View
                    </Link>
                    <Link href={`/holidaze/venues/${venue.id}/edit`} className="text-center py-1.5 bg-custom-blue hover:bg-blue-700 rounded text-sm text-white transition-colors">
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookings for My Venues */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Upcoming Bookings for My Venues</h2>
        {/* This would require an additional API call to get bookings for the manager's venues */}
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Bookings for your venues will appear here.</p>
        </div>
      </div>
    </div>
  );
}
