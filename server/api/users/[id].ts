import { db, schema } from '../../../db'
import { updateUserSchema } from '../../../db/schemas'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = parseInt(getRouterParam(event, 'id') || '0')
  
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID'
    })
  }
  
  try {
    if (event.node.req.method === 'GET') {
      // Get specific user
      const [user] = await db.select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        createdAt: schema.users.createdAt,
      }).from(schema.users).where(eq(schema.users.id, userId))
      
      if (!user) {
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found'
        })
      }
      
      return user
    }
    
    if (event.node.req.method === 'PUT') {
      // Update user
      const body = await readBody(event)
      
      // Validate the request body using the generated schema
      const validatedData = updateUserSchema.parse(body)
      
      const [updatedUser] = await db.update(schema.users)
        .set(validatedData)
        .where(eq(schema.users.id, userId))
        .returning({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          createdAt: schema.users.createdAt,
        })
      
      if (!updatedUser) {
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found'
        })
      }
      
      return updatedUser
    }
    
    if (event.node.req.method === 'DELETE') {
      // Delete user
      const [deletedUser] = await db.delete(schema.users)
        .where(eq(schema.users.id, userId))
        .returning({ id: schema.users.id })
      
      if (!deletedUser) {
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found'
        })
      }
      
      setResponseStatus(event, 204)
      return { message: 'User deleted successfully' }
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
