import { db, schema } from '../../db'
import { count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Get counts for each table
    const [usersCount] = await db.select({ count: count() }).from(schema.users)
    const [householdsCount] = await db.select({ count: count() }).from(schema.households)
    const [personsCount] = await db.select({ count: count() }).from(schema.persons)
    const [scenariosCount] = await db.select({ count: count() }).from(schema.scenarios)

    return {
      users: usersCount.count,
      households: householdsCount.count,
      persons: personsCount.count,
      scenarios: scenariosCount.count
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch statistics'
    })
  }
})
