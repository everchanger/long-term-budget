import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  // Only process API routes
  if (!event.node.req.url?.startsWith("/api/")) {
    return;
  }

  try {
    // Get session for all API routes
    const session = await auth.api.getSession({
      headers: event.headers,
    });

    // Add session to event context so API routes can access it
    event.context.session = session;

    // Log session structure in development for debugging
    if (process.env.NODE_ENV === "development" && session) {
      console.debug("Session structure:", {
        hasUser: !!session.user,
        userId: session.user?.id,
        hasSession: !!session.session,
      });
    }
  } catch (error) {
    // Log the error in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.debug("Auth middleware error:", error);
    }
    // Let individual routes handle auth requirements
    event.context.session = null;
  }
});
