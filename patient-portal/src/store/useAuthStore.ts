import { create } from "zustand";

/**
 * Interface representing the authenticated user profile.
 */
export interface UserProfile {
  id: string;     // Unique UUID of the user account.
  name: string;   // Full name of the user.
  email: string;  // Unique email address.
  role: string;   // System role (Patient, Doctor, Admin).
}

/**
 * Interface representing the authentication state and operations.
 */
interface AuthState {
  token: string | null;          // JWT token string.
  user: UserProfile | null;      // Logged-in user profile payload.
  isAuthenticated: boolean;      // Boolean flag indicating active session.
  
  /**
   * Caches token and user values in local state and localStorage.
   * Inputs:
   *   token (string): Valid JWT issued by gateway.
   *   user (UserProfile): Patient details payload.
   */
  setAuth: (token: string, user: UserProfile) => void;
  
  /**
   * Purges cached token and user credentials to log out.
   */
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Gracefully load initial values from browser storage if active in client runtime
  const isClient = typeof window !== "undefined";
  const initialToken = isClient ? localStorage.getItem("med_token") : null;
  let initialUser: UserProfile | null = null;
  
  if (isClient) {
    const savedUser = localStorage.getItem("med_user");
    if (savedUser) {
      try {
        initialUser = JSON.parse(savedUser);
      } catch {
        initialUser = null;
      }
    }
  }

  return {
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,
    setAuth: (token: string, user: UserProfile) => {
      if (isClient) {
        localStorage.setItem("med_token", token);
        localStorage.setItem("med_user", JSON.stringify(user));
      }
      set({ token, user, isAuthenticated: true });
    },
    clearAuth: () => {
      if (isClient) {
        localStorage.removeItem("med_token");
        localStorage.removeItem("med_user");
      }
      set({ token: null, user: null, isAuthenticated: false });
    }
  };
});
