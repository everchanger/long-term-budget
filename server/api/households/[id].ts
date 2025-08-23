import { db, schema } from '../../../db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const householdId = parseInt(getRouterParam(event, 'id') || '0')
  
  if (!householdId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid household ID'
    })
  }
  
  try {
    if (event.node.req.method === 'GET') {
      // Get specific household with owner info
      const [household] = await db.select({
        id: schema.households.id,
        name: schema.households.name,
        userId: schema.households.userId,
        createdAt: schema.households.createdAt,
        ownerName: schema.users.name,
      }).from(schema.households)
        .leftJoin(schema.users, eq(schema.households.userId, schema.users.id))
        .where(eq(schema.households.id, householdId))
      
      if (!household) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Household not found'
        })
      }
      
      // Get persons in this household
      const persons = await db.select()
        .from(schema.persons)
        .where(eq(schema.persons.householdId, householdId))
        .orderBy(schema.persons.createdAt)
      
      return {
        ...household,
        persons
      }
    }
    
    if (event.node.req.method === 'PUT') {
      // Update household
      const body = await readBody(event)
      const { name } = body
      
      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name is required'
        })
      }
      
      const [updatedHousehold] = await db.update(schema.households)
        .set({ name })
        .where(eq(schema.households.id, householdId))
        .returning()
      
      if (!updatedHousehold) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Household not found'
        })
      }
      
      return updatedHousehold
    }
    
    if (event.node.req.method === 'DELETE') {
      // Delete household
      const [deletedHousehold] = await db.delete(schema.households)
        .where(eq(schema.households.id, householdId))
        .returning({ id: schema.households.id })
      
      if (!deletedHousehold) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Household not found'
        })
      }
      
      return { message: 'Household deleted successfully' }
    }
    
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
    
  } catch (error) {
    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database operation failed'
    })
  }
})
