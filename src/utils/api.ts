const API_BASE_URL = "https://v2.api.noroff.dev";

import { Venue } from "@/types/booking";

export async function createApiKey() {
  try {
    console.log("Creating new API key..."); // Debug log

    // Get the access token
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_BASE_URL}/auth/create-api-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Holidaze API Key",
      }),
    });

    console.log("API key creation response status:", response.status); // Debug log
    const responseText = await response.text();
    console.log("API key creation response:", responseText); // Debug log

    if (!response.ok) {
      throw new Error(
        `Failed to create API key: ${response.status} ${responseText}`
      );
    }

    const data = JSON.parse(responseText);
    console.log("API key created successfully:", data); // Debug log

    if (!data.data?.key) {
      throw new Error("No API key in response");
    }

    localStorage.setItem("noroff_api_key", data.data.key);
    return data.data.key;
  } catch (error) {
    console.error("Error creating API key:", error);
    throw error;
  }
}

export function getApiKey(): string | null {
  return localStorage.getItem("noroff_api_key");
}

export async function ensureApiKey(): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return await createApiKey();
  }
  return apiKey;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("accessToken");
  const apiKey = await ensureApiKey();

  if (!token || !apiKey) {
    throw new Error("Authentication required");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Noroff-API-Key": apiKey,
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

// Function to fetch venue data with reliable cache busting
export async function fetchVenueDetails(venueId: string) {
  // Check for local venue first
  if (venueId && venueId.startsWith("temp-")) {
    // Check localStorage for the venue
    const userVenues = localStorage.getItem("userVenues");
    if (userVenues) {
      // Always parse fresh from localStorage to get latest data
      const parsedVenues = JSON.parse(userVenues);
      const localVenue = parsedVenues.find((v: Venue) => v.id === venueId);

      if (localVenue) {
        return { data: localVenue, error: null, isLocal: true };
      }
    }
  }

  // If not found in localStorage or not a local venue, try the API
  // Add timestamp for cache busting
  const apiUrl = `https://v2.api.noroff.dev/holidaze/venues/${venueId}?_bookings=true`;

  try {
    const response = await fetch(apiUrl, {
      cache: "no-store", // Tell fetch to always get fresh data
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch venue: ${response.statusText}`);
    }

    const responseData = await response.json();
    const apiVenue = responseData.data;

    // Process owner information
    if (apiVenue && typeof apiVenue.owner === "string") {
      apiVenue.owner = {
        name: apiVenue.owner,
        email: "",
        avatar: "",
      };
    }

    return { data: apiVenue, error: null, isLocal: false };
  } catch (error) {
    console.error("Error fetching venue:", error);

    // Try to find venue in localStorage as fallback
    try {
      const userVenues = localStorage.getItem("userVenues");
      if (userVenues) {
        const parsedVenues = JSON.parse(userVenues);
        const localVenue = parsedVenues.find((v: Venue) => v.id === venueId);

        if (localVenue) {
          return { data: localVenue, error: null, isLocal: true };
        }
      }
    } catch (localError) {
      console.error("Error checking localStorage for venue:", localError);
    }

    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to fetch venue data",
      isLocal: false,
    };
  }
}

// Function to create a new booking
export async function createBooking(bookingData: {
  dateFrom: string;
  dateTo: string;
  guests: number;
  venueId: string;
}) {
  try {
    const response = await fetchWithAuth(
      "https://v2.api.noroff.dev/holidaze/bookings",
      {
        method: "POST",
        body: JSON.stringify(bookingData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create booking: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();
    return { data: data.data, error: null };
  } catch (error) {
    console.error("Error creating booking:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to create booking",
    };
  }
}
