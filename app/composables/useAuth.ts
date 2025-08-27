import { createAuthClient } from "better-auth/client";

// Create auth client instance
const client = createAuthClient({
  baseURL: process.client ? window.location.origin : "http://localhost:3000",
});

// Export composable function as default export
export default function useAuth() {
  return {
    signIn: client.signIn,
    signUp: client.signUp,
    signOut: client.signOut,
    getSession: client.getSession,
    useSession: client.useSession,
  };
}
