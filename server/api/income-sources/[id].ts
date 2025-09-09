import { db, schema } from '../../../db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Income source ID is required'
    })
  }
  
  try {
    if (event.node.req.method === 'PUT') {
      // Update income source
      const body = await readBody(event)
      const { name, amount, frequency, start_date, end_date, is_active } = body
      
      if (!name || !amount || !frequency) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name, amount, and frequency are required'
        })
      }
      
      const [updatedIncomeSource] = await db.update(schema.incomeSources)
        .set({
          name,
          amount: amount.toString(),
          frequency,
          startDate: start_date ? new Date(start_date) : null,
          endDate: end_date ? new Date(end_date) : null,
          isActive: is_active ?? true
        })
        .where(eq(schema.incomeSources.id, parseInt(id)))
        .returning()
      
      if (!updatedIncomeSource) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Income source not found'
        })
      }
      
      return updatedIncomeSource
    }
    
    if (event.node.req.method === 'DELETE') {
      // Delete income source
      const [deletedIncomeSource] = await db.delete(schema.incomeSources)
        .where(eq(schema.incomeSources.id, parseInt(id)))
        .returning()
      
      if (!deletedIncomeSource) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Income source not found'
        })
      }
      
      return { message: 'Income source deleted successfully' }
    }
    
  } catch (error: any) {
    console.error('Income source API error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal server error'
    })
  }
})
