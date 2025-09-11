import { createAuthClient } from "better-auth/vue";

// Create auth client instance
const client = createAuthClient();

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
