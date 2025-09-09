import { db, schema } from '../../../db'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    if (event.node.req.method === 'GET') {
      // Get all persons with household info
      const persons = await db.select({
        id: schema.persons.id,
        name: schema.persons.name,
        age: schema.persons.age,
        householdId: schema.persons.householdId,
        createdAt: schema.persons.createdAt,
        householdName: schema.households.name,
      }).from(schema.persons)
        .leftJoin(schema.households, eq(schema.persons.householdId, schema.households.id))
        .orderBy(desc(schema.persons.createdAt))
      
      return persons
    }
    
    if (event.node.req.method === 'POST') {
      // Create a new person
      const body = await readBody(event)
      const { name, age, household_id } = body
      
      if (!name || !household_id) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name and household_id are required'
        })
      }
      
      // Verify household exists
      const [householdExists] = await db.select({ id: schema.households.id })
        .from(schema.households)
        .where(eq(schema.households.id, household_id))
      
      if (!householdExists) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Household not found'
        })
      }
      
      const [newPerson] = await db.insert(schema.persons)
        .values({ 
          name, 
          age: age || null, 
          householdId: household_id 
        })
        .returning()
      
      return newPerson
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
