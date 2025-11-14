import { successResponse } from "@s/utils/api-response";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  const db = useDrizzle();

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(tables.users.id, session.user.id),
      columns: {
        locale: true,
        currency: true,
      },
    });

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: "User not found",
      });
    }

    return successResponse({
      locale: user.locale,
      currency: user.currency,
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch preferences",
    });
  }
});
