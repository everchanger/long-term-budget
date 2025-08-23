import { db, schema } from '../../../db'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    if (event.node.req.method === 'GET') {
      // Get all households with owner info
      const households = await db.select({
        id: schema.households.id,
        name: schema.households.name,
        userId: schema.households.userId,
        createdAt: schema.households.createdAt,
        ownerName: schema.users.name,
      }).from(schema.households)
        .leftJoin(schema.users, eq(schema.households.userId, schema.users.id))
        .orderBy(desc(schema.households.createdAt))
      
      return households
    }
    
    if (event.node.req.method === 'POST') {
      // Create a new household
      const body = await readBody(event)
      const { name, user_id } = body
      
      if (!name || !user_id) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name and user_id are required'
        })
      }
      
      // Verify user exists
      const [userExists] = await db.select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.id, user_id))
      
      if (!userExists) {
        throw createError({
          statusCode: 400,
          statusMessage: 'User not found'
        })
      }
      
      const [newHousehold] = await db.insert(schema.households)
        .values({ name, userId: user_id })
        .returning()
      
      return newHousehold
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
