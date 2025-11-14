import { successResponse } from "@s/utils/api-response";
import { updateUserPreferencesSchema } from "@db/validation-schemas";

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
    const body = await readBody(event);
    const validated = updateUserPreferencesSchema.parse(body);

    const updateData: Record<string, string> = {};
    if (validated.locale) updateData.locale = validated.locale;
    if (validated.currency) updateData.currency = validated.currency;

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No preferences to update",
      });
    }

    await db
      .update(tables.users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(tables.users.id, session.user.id));

    return successResponse({ message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update preferences",
    });
  }
});
