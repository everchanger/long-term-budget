import { db } from '../../../db'
import * as schema from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method === 'GET') {
    // Get all scenarios for the user's household
    const query = getQuery(event)
    const householdId = query.householdId as string
    
    if (!householdId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Household ID is required'
      })
    }
    
    const scenarios = await db.query.scenarios.findMany({
      where: eq(schema.scenarios.householdId, parseInt(householdId)),
      orderBy: schema.scenarios.createdAt
    })
    
    return scenarios
  }
  
  if (method === 'POST') {
    // Create a new scenario
    const body = await readBody(event)
    const { householdId, name, description, startDate, endDate } = body
    
    if (!householdId || !name || !startDate || !endDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }
    
    const [scenario] = await db.insert(schema.scenarios).values({
      householdId: parseInt(householdId),
      name,
      description: description || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    }).returning()
    
    return scenario
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
