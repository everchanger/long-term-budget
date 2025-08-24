import { db } from '../../../db'
import * as schema from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const scenarioId = getRouterParam(event, 'id')
  
  if (!scenarioId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Scenario ID is required'
    })
  }
  
  if (method === 'GET') {
    // Get scenario by ID
    const scenario = await db.query.scenarios.findFirst({
      where: eq(schema.scenarios.id, parseInt(scenarioId)),
    })
    
    if (!scenario) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Scenario not found'
      })
    }
    
    return scenario
  }
  
  if (method === 'PUT') {
    // Update scenario
    const body = await readBody(event)
    const { name, description, startDate, endDate } = body
    
    const [updatedScenario] = await db.update(schema.scenarios)
      .set({
        name: name || undefined,
        description: description || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      })
      .where(eq(schema.scenarios.id, parseInt(scenarioId)))
      .returning()
    
    if (!updatedScenario) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Scenario not found'
      })
    }
    
    return updatedScenario
  }
  
  if (method === 'DELETE') {
    // Delete scenario
    const [deletedScenario] = await db.delete(schema.scenarios)
      .where(eq(schema.scenarios.id, parseInt(scenarioId)))
      .returning()
    
    if (!deletedScenario) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Scenario not found'
      })
    }
    
    return { success: true, id: parseInt(scenarioId) }
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
