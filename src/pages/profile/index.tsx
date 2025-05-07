import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import GuestProfile from "@/components/profile/GuestProfile";
import VenueManagerProfile from "@/components/profile/VenueManagerProfile";

export default function ProfilePage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if guest is logged in
    const storedUserProfile = localStorage.getItem("userProfile"); // Note: storage key remains 'user' for compatibility
    const token = localStorage.getItem("accessToken");

    if (!storedUserProfile || !token) {
      router.push("/login");
      return;
    }

    try {
      const userProfile = JSON.parse(storedUserProfile);
      setUserRole(userProfile.venueManager ? "Manager" : "Guest");
    } catch (error) {
      console.error("Failed to parse guest data:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

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
        <title>My Profile | Holidaze</title>
        <meta
          name="description"
          content="View and manage your Holidaze profile"
        />
      </Head>

      {userRole === "Manager" ? <VenueManagerProfile /> : <GuestProfile />}
    </>
  );
}
