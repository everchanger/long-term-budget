import { db } from '../../../db'
import * as schema from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { ForecastingEngine } from '../../utils/forecasting-engine'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method === 'POST') {
    const body = await readBody(event)
    const { baselineScenarioId, comparisonScenarioId } = body
    
    if (!baselineScenarioId || !comparisonScenarioId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Both baseline and comparison scenario IDs are required'
      })
    }
    
    // Verify scenarios exist
    const baselineScenario = await db.query.scenarios.findFirst({
      where: eq(schema.scenarios.id, parseInt(baselineScenarioId))
    })
    
    const comparisonScenario = await db.query.scenarios.findFirst({
      where: eq(schema.scenarios.id, parseInt(comparisonScenarioId))
    })
    
    if (!baselineScenario || !comparisonScenario) {
      throw createError({
        statusCode: 404,
        statusMessage: 'One or both scenarios not found'
      })
    }
    
    // Generate comparison
    const comparison = await ForecastingEngine.compareScenarios(
      parseInt(baselineScenarioId),
      parseInt(comparisonScenarioId)
    )
    
    // Save comparison results
    const [savedComparison] = await db.insert(schema.scenarioComparisons).values({
      baselineScenarioId: parseInt(baselineScenarioId),
      comparisonScenarioId: parseInt(comparisonScenarioId),
      comparisonData: JSON.stringify(comparison),
    }).returning()
    
    return {
      comparison: savedComparison,
      data: comparison
    }
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
