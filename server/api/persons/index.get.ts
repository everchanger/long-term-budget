import { db, schema } from '../../../db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const query = getQuery(event)
    const householdId = query.householdId ? Number(query.householdId) : null

    // If householdId is provided, filter by it
    if (householdId) {
      const householdPersons = await db
        .select({
          id: schema.persons.id,
          name: schema.persons.name,
          age: schema.persons.age,
          householdId: schema.persons.householdId,
          createdAt: schema.persons.createdAt,
        })
        .from(schema.persons)
        .where(eq(schema.persons.householdId, householdId))
        .orderBy(schema.persons.createdAt)

      return householdPersons
    }

    // Otherwise return all persons (this might need user filtering in the future)
    const allPersons = await db
      .select({
        id: schema.persons.id,
        name: schema.persons.name,
        age: schema.persons.age,
        householdId: schema.persons.householdId,
        createdAt: schema.persons.createdAt,
      })
      .from(schema.persons)
      .orderBy(schema.persons.createdAt)

    return allPersons
  } catch (error) {
    console.error('Error fetching persons:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch persons'
    })
  }
})
