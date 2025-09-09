import { db, schema } from '../../../db'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    if (event.node.req.method === 'GET') {
      // Get all income sources for a specific person
      const query = getQuery(event)
      const personId = query.personId as string
      
      if (!personId) {
        const incomeSources = await db.select().from(schema.incomeSources)
          .orderBy(desc(schema.incomeSources.createdAt))
        return incomeSources
      }
      
      const incomeSources = await db.select().from(schema.incomeSources)
        .where(eq(schema.incomeSources.personId, parseInt(personId)))
        .orderBy(desc(schema.incomeSources.createdAt))
      
      return incomeSources
    }
    
    if (event.node.req.method === 'POST') {
      // Create a new income source
      const body = await readBody(event)
      const { person_id, name, amount, frequency, start_date, end_date, is_active } = body
      
      if (!name || !amount || !frequency || !person_id) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name, amount, frequency, and person_id are required'
        })
      }
      
      // Verify person exists
      const [personExists] = await db.select({ id: schema.persons.id })
        .from(schema.persons)
        .where(eq(schema.persons.id, person_id))
      
      if (!personExists) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Person not found'
        })
      }
      
      const [newIncomeSource] = await db.insert(schema.incomeSources)
        .values({ 
          personId: person_id,
          name, 
          amount: amount.toString(),
          frequency,
          startDate: start_date ? new Date(start_date) : null,
          endDate: end_date ? new Date(end_date) : null,
          isActive: is_active ?? true
        })
        .returning()
      
      return newIncomeSource
    }
    
  } catch (error: any) {
    console.error('Income sources API error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal server error'
    })
  }
})
