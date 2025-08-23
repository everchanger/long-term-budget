import { db, schema } from '../../../db'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    if (event.node.req.method === 'GET') {
      // Get all users
      const users = await db.select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        createdAt: schema.users.createdAt,
      }).from(schema.users).orderBy(desc(schema.users.createdAt))
      
      return users
    }
    
    if (event.node.req.method === 'POST') {
      // Create a new user
      const body = await readBody(event)
      const { name, email } = body
      
      if (!name || !email) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name and email are required'
        })
      }
      
      const [newUser] = await db.insert(schema.users)
        .values({ name, email })
        .returning({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          createdAt: schema.users.createdAt,
        })
      
      return newUser
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
