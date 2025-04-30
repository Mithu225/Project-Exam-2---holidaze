"use client";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "./SearchBar";
import { useEffect, useState } from "react";

export default function Header() {
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  // Function to check login status and update state
  const checkLoginStatus = () => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (storedUser && token) {
      try {
        const userData = JSON.parse(storedUser);
        setUserName(userData.name || "");
        setUserRole(userData.role || "Guest");
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    // Check login status on mount
    checkLoginStatus();
    
    // Add event listener for storage changes (for changes in other tabs)
    window.addEventListener('storage', checkLoginStatus);
    
    // Create a custom event listener for login changes in the current tab
    const handleLoginChange = () => checkLoginStatus();
    document.addEventListener('loginStateChanged', handleLoginChange);
    
    // Check status every second to handle any changes
    const intervalId = setInterval(checkLoginStatus, 1000);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      document.removeEventListener('loginStateChanged', handleLoginChange);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <header className="bg-white text-custom-blue shadow-md">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
        <div className="p-0">
          <Image
            src="/asset/holidaze-header-logo.png"
            alt="Holidaze Logo"
            height={170}
            width={224}
          />
        </div>

       
      <SearchBar />
      <nav>
          <ul className="flex flex-col sm:flex-row font-bold gap-4">
            <li>
              <Link 
                href={isLoggedIn ? "/profile" : "/login"} 
                className="hover:text-custom-blue transition flex items-center gap-1"
              >
                <User className="w-5 h-5 stroke-[2.5px]" />
                <span>
                  {isLoggedIn ? (
                    <span className="flex flex-col text-xs sm:text-sm">
                      <span className="font-bold">{userName}</span>
                      <span className="text-custom-gray">{userRole}</span>
                    </span>
                  ) : (
                    "Account"
                  )}
                </span>
              </Link>
            </li>
            
           
          </ul>
        </nav>
   
      </div>
    </header>
  );
}
