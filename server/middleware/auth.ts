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
  } catch {
    // Log the error but don't throw - let individual routes handle auth requirements
    event.context.session = null;
  }
});
