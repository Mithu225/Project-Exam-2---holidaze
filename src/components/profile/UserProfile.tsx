'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Mail, Calendar, LogOut } from 'lucide-react';
import { useRouter } from 'next/router';
import BookingList from '../BookingList';

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

export default function UserProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
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
      setUserData(user);
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
      {/* Banner Image */}
      <div className="relative w-full h-48 mb-16 rounded-lg overflow-hidden bg-gray-200">
        {userData.banner ? (
          <Image 
            src={userData.banner.url} 
            alt={userData.banner.alt || 'Profile banner'} 
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-custom-blue to-blue-400"></div>
        )}
        
        {/* Profile Avatar */}
        <div className="absolute -bottom-12 left-6 w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white">
          {userData.avatar ? (
            <Image 
              src={userData.avatar.url}
              alt={userData.avatar.alt || 'Avatar'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <User className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-custom-blue">{userData.name}</h1>
          <div className="flex items-center text-custom-gray mt-1">
            <Mail className="w-4 h-4 mr-1" />
            <span>{userData.email}</span>
          </div>
          <div className="flex items-center text-custom-gray mt-1">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Member since April 2025</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </button>
      </div>

      {/* Bookings Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">My Bookings</h2>
        <BookingList />
      </div>
    </div>
  );
}
