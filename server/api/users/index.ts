import { db, schema } from '../../../db'
import { insertUserSchema } from '../../../db/schemas'
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
      
      // Validate the request body using the generated schema
      const validatedData = insertUserSchema.parse(body)
      
      const [newUser] = await db.insert(schema.users)
        .values(validatedData)
        .returning({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          createdAt: schema.users.createdAt,
        })
      
      setResponseStatus(event, 201)
      return newUser
    }
    
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
    
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: error.errors
      })
    }
    
    if (error.statusCode) {
      throw error
    }
    
    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database operation failed'
    })
  }
})
