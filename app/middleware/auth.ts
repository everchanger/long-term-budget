export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return;

  const { getSession } = useAuth();

  try {
    const session = await getSession();

    if (!session.data) {
      return navigateTo("/auth");
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return navigateTo("/auth");
  }
});
