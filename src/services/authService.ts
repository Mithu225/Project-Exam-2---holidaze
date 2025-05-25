import { z } from "zod";


const API_BASE_URL = "https://v2.api.noroff.dev";

export const registerSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters" })
    .regex(/^[\w]+$/, {
      message: "Name can only contain letters, numbers, and underscore",
    })
    .max(20, { message: "Name cannot exceed 20 characters" }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .regex(/^[\w\-.]+@(stud\.)?noroff\.no$/, {
      message: "Must be a valid Noroff email address (example@stud.noroff.no)",
    }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  bio: z
    .string()
    .max(160, { message: "Bio cannot exceed 160 characters" })
    .optional()
    .or(z.literal("")),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;


export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;


export type UserRole = "Guest" | "venueManager";


export async function registerUser(
  userData: RegisterFormValues & { venueManager?: boolean }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage =
        responseData.errors
          ?.map((err: any) =>
            typeof err === "object"
              ? err.message || JSON.stringify(err)
              : String(err)
          )
          .join(", ") ||
        responseData.message ||
        "Registration failed";

      return { success: false, error: errorMessage };
    }

    return { success: true, data: responseData.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
}


export async function loginUser(
  credentials: LoginFormValues
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || "Login failed",
      };
    }

    return { success: true, data: responseData.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
}
