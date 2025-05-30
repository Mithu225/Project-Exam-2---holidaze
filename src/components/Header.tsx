"use client";
import { User, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const router = useRouter();

 
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
    setUserName("");
    setUserRole("");
    router.push("/login");
  };


  const checkLoginStatus = () => {
    const storedUserProfile = localStorage.getItem("userProfile");
    const token = localStorage.getItem("accessToken");

    if (storedUserProfile && token) {
      try {
        const userData = JSON.parse(storedUserProfile);
        setUserName(userData.name || "");
        setUserRole(userData.venueManager ? "Manager" : "Guest");
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    
    checkLoginStatus();

   
    window.addEventListener("storage", checkLoginStatus);

  
    const handleLoginChange = () => checkLoginStatus();
    document.addEventListener("loginStateChanged", handleLoginChange);

    const intervalId = setInterval(checkLoginStatus, 1000);

    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      document.removeEventListener("loginStateChanged", handleLoginChange);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <header className="bg-white text-custom-blue shadow-md w-full">
      <div className="w-full max-w-screen-lg mx-auto flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
        <div className="p-0">
          <Link href="/" aria-label="Go to home page">
            <Image
              src="/asset/header-logo.png"
              alt="Venue Logo"
              height={170}
              width={224}
              className="cursor-pointer"
            />
          </Link>
        </div>

        <nav>
          <ul className="flex flex-col sm:flex-row font-bold gap-4 items-center">
            <li>
              <Link
                href={isLoggedIn ? "/profile" : "/login"}
                className="hover:text-custom-blue transition flex items-center gap-1"
                title="View Profile"
              >
                <User className="w-5 h-5 stroke-[2.5px]" />
                <span>
                  {isLoggedIn ? (
                    <span className="flex flex-col text-xs sm:text-sm">
                      <span className="font-bold">{userName}</span>
                      <span className="text-custom-gray">
                        {userRole === "venueManager" ? "Manager" : userRole}
                      </span>
                    </span>
                  ) : (
                    "Account"
                  )}
                </span>
              </Link>
            </li>

            {isLoggedIn && (
              <li>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-custom-blue border-custom-blue"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </Button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
