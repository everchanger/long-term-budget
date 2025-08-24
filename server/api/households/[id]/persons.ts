import { db, schema } from '../../../../db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const householdId = parseInt(getRouterParam(event, 'id') || '0')
  
  if (!householdId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid household ID'
    })
  }

  if (getMethod(event) === 'GET') {
    // Get all persons in this household
    const persons = await db.select()
      .from(schema.persons)
      .where(eq(schema.persons.householdId, householdId))
      .orderBy(schema.persons.createdAt)

    return {
      persons
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
