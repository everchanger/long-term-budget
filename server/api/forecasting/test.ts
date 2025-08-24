import { db } from '../../../db'
import * as schema from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { ForecastingEngine } from '../../utils/forecasting-engine'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const householdId = query.householdId as string
  
  if (!householdId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Household ID is required'
    })
  }
  
  try {
    // Create a simple test scenario
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 5) // 5 years from now
    
    const projections = await ForecastingEngine.calculateProjections({
      householdId: parseInt(householdId),
      startDate: new Date(),
      endDate,
      modifications: []
    })
    
    // Return summary data
    const summary = {
      householdId: parseInt(householdId),
      projectionPeriod: `${new Date().toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalProjections: projections.length,
      initialSnapshot: projections[0] || null,
      finalSnapshot: projections[projections.length - 1] || null,
      netWorthGrowth: projections.length > 1 
        ? projections[projections.length - 1].netWorth - projections[0].netWorth 
        : 0
    }
    
    return summary
  } catch (error) {
    console.error('Forecasting test error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate forecast test'
    })
  }
})
