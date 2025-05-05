'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Mail, Edit, Plus, Home } from 'lucide-react';
import { useRouter } from 'next/router';
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
  const [formData, setFormData] = useState({
    bio: '',
    avatarUrl: ''
  });
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      
      // Check if user is a venue manager
      if (user.role !== 'venueManager') {
        router.push('/profile');
        return;
      }
      
      setUserData(user);
      
      // Fetch manager's venues
      fetchManagerVenues(token);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      setLoading(false);
    }
  }, [router]);

  const fetchManagerVenues = async (token: string) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userName = user.name;
      
      if (!userName) {
        throw new Error('User information is missing');
      }
      
      console.log(`Attempting to fetch venues for profile: ${userName}`);
      
      // Try the profile endpoint first (check if token is prefixed with 'Bearer')
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      try {
        // First attempt: directly access the profile venues
        const profileResponse = await fetch(`https://v2.api.noroff.dev/holidaze/profiles/${userName}/venues`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('Profile venues data retrieved successfully');
          setVenues(profileData.data || []);
          setLoading(false);
          return;
        }
        
        console.warn(`Profile endpoint failed with status: ${profileResponse.status}. Trying fallback...`);
      } catch (profileError) {
        console.error('Error with profile endpoint:', profileError);
      }
      
      // Fallback method: Get all venues and filter by owner
      console.log('Using fallback method: fetching all venues');
      try {
        const allVenuesResponse = await fetch('https://v2.api.noroff.dev/holidaze/venues', {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (!allVenuesResponse.ok) {
          // Handle specific error codes
          if (allVenuesResponse.status === 429) {
            console.warn('Rate limit exceeded. Please try again in a moment.');
            setVenues([]);
            return;
          }
          console.error(`API error: ${allVenuesResponse.status}`);
          setVenues([]);
          return;
        }
        
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
        
        console.log(`Filtered ${myVenues.length} venues belonging to ${userName}`);
        setVenues(myVenues);
      } catch (fallbackError) {
        console.error('Fallback method error:', fallbackError);
        setVenues([]);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      setVenues([]);
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
          <Link href="/holidaze/venues/create" className="flex items-center justify-center px-4 py-2 bg-custom-blue hover:bg-blue-700 rounded-md text-white transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Add Venue
          </Link>
          <button 
            onClick={handleEditFormOpen}
            className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        </div>
      </div>

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
