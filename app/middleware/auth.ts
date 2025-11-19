export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server-side rendering
  if (import.meta.server) return;

  // Allow public routes
  const publicRoutes = ["/auth", "/"];
  if (publicRoutes.includes(to.path)) {
    return;
  }

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
