import { db, schema } from '../../../db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const personId = parseInt(getRouterParam(event, 'id') || '0')
  
  if (!personId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid person ID'
    })
  }
  
  try {
    if (event.node.req.method === 'GET') {
      // Get specific person with household info
      const [person] = await db.select({
        id: schema.persons.id,
        name: schema.persons.name,
        age: schema.persons.age,
        householdId: schema.persons.householdId,
        createdAt: schema.persons.createdAt,
        householdName: schema.households.name,
      }).from(schema.persons)
        .leftJoin(schema.households, eq(schema.persons.householdId, schema.households.id))
        .where(eq(schema.persons.id, personId))
      
      if (!person) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Person not found'
        })
      }
      
      return person
    }
    
    if (event.node.req.method === 'PUT') {
      // Update person
      const body = await readBody(event)
      const { name, age } = body
      
      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name is required'
        })
      }
      
      const [updatedPerson] = await db.update(schema.persons)
        .set({ name, age: age || null })
        .where(eq(schema.persons.id, personId))
        .returning()
      
      if (!updatedPerson) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Person not found'
        })
      }
      
      return updatedPerson
    }
    
    if (event.node.req.method === 'DELETE') {
      // Delete person
      const [deletedPerson] = await db.delete(schema.persons)
        .where(eq(schema.persons.id, personId))
        .returning({ id: schema.persons.id })
      
      if (!deletedPerson) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Person not found'
        })
      }
      
      return { message: 'Person deleted successfully' }
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
