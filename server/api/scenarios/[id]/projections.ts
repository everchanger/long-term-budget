import { db } from '../../../../db'
import * as schema from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import { ForecastingEngine } from '../../../utils/forecasting-engine'

export default defineEventHandler(async (event) => {
  const scenarioId = getRouterParam(event, 'id')
  
  if (!scenarioId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Scenario ID is required'
    })
  }
  
  const method = getMethod(event)
  
  if (method === 'POST') {
    // Generate projections for a scenario
    const body = await readBody(event).catch(() => ({}))
    const { modifications = [] } = body || {}
    
    // Get the scenario
    const scenario = await db.query.scenarios.findFirst({
      where: eq(schema.scenarios.id, parseInt(scenarioId))
    })
    
    if (!scenario) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Scenario not found'
      })
    }
    
    // Generate projections
    const projections = await ForecastingEngine.calculateProjections({
      householdId: scenario.householdId,
      startDate: new Date(scenario.startDate),
      endDate: new Date(scenario.endDate),
      modifications: modifications
    })
    
    // Save projections to database
    await ForecastingEngine.saveProjections(parseInt(scenarioId), projections)
    
    return { success: true, projections }
  }
  
  if (method === 'GET') {
    // Get existing projections for a scenario
    const projections = await db.query.projections.findMany({
      where: eq(schema.projections.scenarioId, parseInt(scenarioId)),
      orderBy: schema.projections.projectionDate
    })
    
    return projections
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
