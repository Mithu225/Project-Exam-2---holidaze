'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Mail, Calendar, LogOut, Edit } from 'lucide-react';
import { useRouter } from 'next/router';
import BookingList from '../BookingList';

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
}

export default function UserProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    avatarUrl: '',
    bannerUrl: ''
  });
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
      setUserData(user);
   
      setFormData({
        bio: user.bio || '',
        avatarUrl: user.avatar?.url || '',
        bannerUrl: user.banner?.url || ''
      });
    } catch (error) {
      console.error('Failed to parse user data:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const handleEditFormOpen = () => {
  
    setFormData({
      bio: userData?.bio || '',
      avatarUrl: '',
      bannerUrl: ''
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
    
    // Update user data
    const updatedUserData = {
      ...userData,
      bio: formData.bio,
  
      avatar: formData.avatarUrl ? {
        url: formData.avatarUrl,
        alt: 'User avatar'
      } : userData.avatar,
      banner: formData.bannerUrl ? {
        url: formData.bannerUrl,
        alt: 'User banner'
      } : userData.banner
    };
    
   
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    setUserData(updatedUserData);
    setShowEditForm(false);
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
    
      <div className="relative w-full h-48 mb-16 rounded-lg  bg-white">
        {userData.banner ? (
          <Image 
            src={userData.banner.url} 
            alt={userData.banner.alt || 'Profile banner'} 
            fill
            className="object-cover rounded-2xl"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-custom-blue to-blue-400"></div>
        )}
        
     
        <div className="absolute -bottom-12 left-6 w-24 h-24">
          {userData.avatar ? (
            <Image 
              src={userData.avatar.url}
              alt={userData.avatar.alt || 'Avatar'}
              fill
              className="object-cover rounded-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <User className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
      </div>

   
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-custom-blue">{userData.name}</h1>
          {userData.bio && (
            <p className="text-gray-600 mt-1 mb-2 italic">&ldquo;{userData.bio}&rdquo;</p>
          )}
          <div className="flex items-center text-custom-gray mt-1">
            <Mail className="w-4 h-4 mr-1" />
            <span>{userData.email}</span>
          </div>
          <div className="flex items-center text-custom-gray mt-1">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Member since April 2025</span>
          </div>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="flex items-center px-4 py-2 bg-custom-blue hover:bg-blue-600 rounded-md text-white transition-colors"
            onClick={handleEditFormOpen}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-white hover:bg-gray-200 border border-custom-blue rounded-md text-custom-blue transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </button>
        </div>
      </div>

  
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
            
            <div className="mb-4">
              <label htmlFor="bannerUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Banner URL
              </label>
              <input
                type="text"
                id="bannerUrl"
                name="bannerUrl"
                value={formData.bannerUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-blue"
                placeholder="Enter banner image URL"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-custom-blue hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                Save Changes
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

    
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">My Bookings</h2>
        <BookingList />
      </div>
    </div>
  );
}
