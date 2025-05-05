
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { Home, Plus, Edit, Trash2, Search, RefreshCw } from 'lucide-react';
import { Venue } from '@/types/booking';

export default function VenueManagementPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
    
      // Redirect all venue managers to the profile page which now has integrated venue management
      router.push('/profile');
      return;
      
      // This code will never run since we're redirecting above
    } catch (error) {
      console.error('Failed to parse user data:', error);
      setLoading(false);
    }
  }, [router]);

  
  const fetchMyVenues = async (username: string, token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      
      console.log(`Trying profile endpoint for user: ${username}`);
      const profileResponse = await fetch(`https://v2.api.noroff.dev/holidaze/profiles/${username}/venues`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
     
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('Profile venues data:', profileData);
      // Debug image URLs
      if (profileData.data && profileData.data.length > 0) {
        profileData.data.forEach(venue => {
          console.log(`Venue ${venue.name} has images:`, venue.media);
        });
      }
        setVenues(profileData.data || []);
        setLoading(false);
        return;
      }
      
      console.log(`Profile endpoint failed, trying fallback method...`);
      
    
      const allVenuesResponse = await fetch('https://v2.api.noroff.dev/holidaze/venues', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!allVenuesResponse.ok) {
        throw new Error(`API error: ${allVenuesResponse.status}`);
      }
      
      const allVenuesData = await allVenuesResponse.json();
      console.log('All venues count:', allVenuesData.data?.length || 0);
      
     
      const myVenues = allVenuesData.data?.filter((venue: any) => {
     
        if (venue.owner) {
          return venue.owner.name === username ||
                 venue.owner.email === JSON.parse(localStorage.getItem('user') || '{}').email;
        }
        
        return false;
      }) || [];
      
      console.log('My filtered venues:', myVenues);
      setVenues(myVenues);
    } catch (error) {
      console.error('Error fetching venues:', error);
      setError('Failed to load venues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (venueId: string) => {
    if (!confirm('Are you sure you want to delete this venue?')) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`https://v2.api.noroff.dev/holidaze/venues/${venueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete venue');
      }
      
    
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.name) {
        fetchMyVenues(user.name, token);
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
      setError('Failed to delete venue. Please try again.');
    }
  };

  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.location.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
   <>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-custom-blue">Manage Your Venues</h1>
          <Link href="/holidaze/venues/create" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-custom-blue text-white rounded-md hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Create New Venue
          </Link>
        </div>

    
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-blue"
              />
            </div>
            <button 
              onClick={() => {
                const token = localStorage.getItem('accessToken');
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (token && user.name) fetchMyVenues(user.name, token);
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-blue"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-red-50 rounded-lg">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => {
                const token = localStorage.getItem('accessToken');
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (token && user.name) fetchMyVenues(user.name, token);
              }}
              className="inline-flex items-center px-4 py-2 bg-custom-blue text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            {searchTerm ? (
              <>
                <p className="text-gray-500 mb-2">No venues match your search.</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-custom-blue hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Home className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No venues yet</h3>
                <p className="text-gray-500 mb-4">You haven't created any venues yet.</p>
                <Link href="/holidaze/venues/create" className="inline-flex items-center px-4 py-2 bg-custom-blue text-white rounded-md hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Venue
                </Link>
              </>
            )}
          </div>
  
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Venue</th>
                  <th className="py-3 px-4 text-left">Location</th>
                  <th className="py-3 px-4 text-left">Price</th>
                  <th className="py-3 px-4 text-left">Rating</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVenues.map(venue => (
                  <tr key={venue.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded overflow-hidden bg-gray-200 relative flex-shrink-0">
                          {venue.media && venue.media.length > 0 ? (
                            <>
                              {/* Debug information */}
                              {console.log('Rendering image with URL:', venue.media[0].url)}
                              {/* Using regular img tag as fallback */}
                              <img
                                src={venue.media[0].url}
                                alt={venue.media[0].alt || venue.name}
                                className="object-cover w-full h-full"
                              />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-custom-blue">{venue.name}</div>
                          <div className="text-sm text-gray-500">Max {venue.maxGuests} guests</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{venue.location.city}</div>
                      <div className="text-sm text-gray-500">{venue.location.country}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-custom-orange">
                      NOK {venue.price}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex text-yellow-500">
                        {'★'.repeat(Math.floor(venue.rating))}{'☆'.repeat(5-Math.floor(venue.rating))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Link href={`/venue/${venue.id}`} className="p-1 text-gray-500 hover:text-custom-blue" title="View">
                          <Home className="w-5 h-5" />
                        </Link>
                        <Link href={`/holidaze/venues/${venue.id}/edit`} className="p-1 text-gray-500 hover:text-custom-blue" title="Edit">
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(venue.id)} 
                          className="p-1 text-gray-500 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
