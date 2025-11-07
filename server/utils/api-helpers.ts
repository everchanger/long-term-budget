import type { H3Event } from "h3";

/**
 * Parse and validate an ID parameter from the route.
 * Throws a 400 error if the ID is missing or not a valid integer.
 *
 * @param event - The H3 event object
 * @param paramName - The name of the route parameter (default: "id")
 * @param errorMessage - Custom error message (optional)
 * @returns The validated integer ID
 * @throws createError with statusCode 400 if validation fails
 *
 * @example
 * const userId = parseIdParam(event, "id");
 * const householdId = parseIdParam(event, "householdId", "Invalid household ID");
 */
export function parseIdParam(
  event: H3Event,
  paramName: string = "id",
  errorMessage?: string
): number {
  const paramValue = getRouterParam(event, paramName);

  if (!paramValue) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage || `${paramName} is required`,
    });
  }

  const parsedId = parseInt(paramValue, 10);

  if (isNaN(parsedId)) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage || `Invalid ${paramName}`,
    });
  }

  return parsedId;
}

/**
 * Parse and validate a query parameter as an integer.
 * Throws a 400 error if the parameter is provided but not a valid integer.
 *
 * @param event - The H3 event object
 * @param paramName - The name of the query parameter
 * @param required - Whether the parameter is required (default: false)
 * @param errorMessage - Custom error message (optional)
 * @returns The validated integer or undefined if not provided (when optional)
 * @throws createError with statusCode 400 if validation fails
 *
 * @example
 * const personId = parseQueryInt(event, "personId", true);
 * const limit = parseQueryInt(event, "limit", false) ?? 10;
 */
export function parseQueryInt(
  event: H3Event,
  paramName: string,
  required: true,
  errorMessage?: string
): number;
export function parseQueryInt(
  event: H3Event,
  paramName: string,
  required?: false,
  errorMessage?: string
): number | undefined;
export function parseQueryInt(
  event: H3Event,
  paramName: string,
  required: boolean = false,
  errorMessage?: string
): number | undefined {
  const query = getQuery(event);
  const paramValue = query[paramName];

  if (!paramValue) {
    if (required) {
      throw createError({
        statusCode: 400,
        statusMessage: errorMessage || `${paramName} is required`,
      });
    }
    return undefined;
  }

  const parsedValue = parseInt(String(paramValue), 10);

  if (isNaN(parsedValue)) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage || `Invalid ${paramName}`,
    });
  }

  return parsedValue;
}
