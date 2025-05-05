'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Mail, Calendar, Edit, Plus, Home } from 'lucide-react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Venue } from '@/types/booking';

interface UserData {
  name: string;
  email: string;
  avatar?: {
    url: string;
    alt: string;
  };
  banner?: {
    url: string;
    alt: string;
  };
}

export default function VenueManagerProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
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
        const myVenues = allVenuesData.data?.filter((venue: any) => {
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

  const handleEditProfile = () => {
    // Implement profile editing logic here
    // For now, we'll just show an alert
    alert('Edit profile functionality will be implemented soon');
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
            onClick={handleEditProfile}
            className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        </div>
      </div>

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
            <p className="text-gray-500 mb-4">You haven't created any venues yet.</p>
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
