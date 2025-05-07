import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { LoginFormValues, loginUser } from "@/services/authService";
import { toast } from "@/components/ui/use-toast";
import { fetchWithAuth } from "@/utils/api";

export type UserRole = "Guest" | "venueManager";

interface User {
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  role: UserRole;
  lastLoginAt: string;
  venueManager?: boolean;
}

interface UseAuthReturn {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginFormValues, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Function to check auth status and update state
  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (storedUser && token) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        setIsLoggedIn(false);
        setUser(null);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  // Fetch profile details from API
  const fetchProfileDetails = async (name: string): Promise<any> => {
    try {
      const response = await fetchWithAuth(
        `https://v2.api.noroff.dev/holidaze/profiles/${name}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile details");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  // Login function
  const login = async (
    credentials: LoginFormValues,
    role: UserRole
  ): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginUser(credentials);

      if (!result.success) {
        setError(result.error || "Login failed");
        return false;
      }

      // Store user data and token
      localStorage.setItem("accessToken", result.data.accessToken);
      localStorage.setItem("user", JSON.stringify(result.data));

      // Fetch user profile details
      const profileData = await fetchProfileDetails(result.data.name);

      const userData: User = {
        name: result.data.name,
        email: credentials.email,
        bio: result.data.bio || "",
        avatar: result.data.avatar || profileData?.avatar,
        banner: result.data.banner || profileData?.banner,
        role: role,
        venueManager: profileData?.venueManager || false,
        lastLoginAt: new Date().toISOString(),
      };

      localStorage.setItem("userProfile", JSON.stringify(profileData));

      // Initialize venues array for first-time users if needed
      if (!localStorage.getItem("userProfile")) {
        localStorage.setItem("userProfile", JSON.stringify({}));
      }

      // Update state
      setUser(userData);
      setIsLoggedIn(true);

      // Dispatch login event for components to react
      const loginEvent = new Event("loginStateChanged");
      document.dispatchEvent(loginEvent);

      // Show success message
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.name}!`,
        variant: "default",
      });

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to login. Please try again.";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);

    // Dispatch logout event
    const logoutEvent = new Event("loginStateChanged");
    document.dispatchEvent(logoutEvent);

    router.push("/login");
  };

  return {
    user,
    isLoggedIn,
    isLoading,
    error,
    login,
    logout,
  };
}
