import { db } from '../../../../db'
import * as schema from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const scenarioId = getRouterParam(event, 'id')
  
  if (!scenarioId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Scenario ID is required'
    })
  }
  
  const method = getMethod(event)
  
  if (method === 'GET') {
    // Get all modifications for a scenario
    const modifications = await db.query.scenarioModifications.findMany({
      where: eq(schema.scenarioModifications.scenarioId, parseInt(scenarioId)),
      orderBy: schema.scenarioModifications.effectiveDate
    })
    
    return modifications
  }
  
  if (method === 'POST') {
    // Add a new modification to a scenario
    const body = await readBody(event)
    const { type, targetId, targetType, modification, effectiveDate } = body
    
    if (!type || !modification || !effectiveDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }
    
    const [newModification] = await db.insert(schema.scenarioModifications).values({
      scenarioId: parseInt(scenarioId),
      type,
      targetId: targetId || null,
      targetType: targetType || null,
      modification: JSON.stringify(modification),
      effectiveDate: new Date(effectiveDate),
    }).returning()
    
    return newModification
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
