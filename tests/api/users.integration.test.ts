import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// Simple API integration tests
describe('Users API Integration Tests', () => {
  const baseURL = 'http://localhost:3000'
  
  beforeAll(async () => {
    // Wait a bit for the server to be ready if needed
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  describe('POST /api/users', () => {
    it('should create a user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      }

      const response = await fetch(`${baseURL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })

      expect(response.status).toBe(201)
      
      const user = await response.json()
      expect(user).toMatchObject({
        id: expect.any(Number),
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: expect.any(String)
      })
    })

    it('should validate required fields', async () => {
      const response = await fetch(`${baseURL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const response = await fetch(`${baseURL}/api/users`)
      
      expect(response.status).toBe(200)
      
      const users = await response.json()
      expect(Array.isArray(users)).toBe(true)
    })
  })

  describe('GET /api/users/:id', () => {
    it('should return a specific user', async () => {
      // First create a user
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      }
      
      const createResponse = await fetch(`${baseURL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      
      const createdUser = await createResponse.json()

      // Then fetch it by ID
      const response = await fetch(`${baseURL}/api/users/${createdUser.id}`)
      
      expect(response.status).toBe(200)
      
      const user = await response.json()
      expect(user).toMatchObject({
        id: createdUser.id,
        name: 'Jane Doe',
        email: 'jane@example.com'
      })
    })

    it('should return 404 for non-existent user', async () => {
      const response = await fetch(`${baseURL}/api/users/999999`)
      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/users/:id', () => {
    it('should update a user', async () => {
      // First create a user
      const userData = {
        name: 'Bob Smith',
        email: 'bob@example.com'
      }
      
      const createResponse = await fetch(`${baseURL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      
      const createdUser = await createResponse.json()

      // Then update it
      const updatedData = {
        name: 'Bob Updated',
        email: 'bob.updated@example.com'
      }

      const response = await fetch(`${baseURL}/api/users/${createdUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      })

      expect(response.status).toBe(200)
      
      const updatedUser = await response.json()
      expect(updatedUser).toMatchObject({
        id: createdUser.id,
        name: 'Bob Updated',
        email: 'bob.updated@example.com'
      })
    })
  })

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      // First create a user
      const userData = {
        name: 'Delete Me',
        email: 'delete@example.com'
      }
      
      const createResponse = await fetch(`${baseURL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      
      const createdUser = await createResponse.json()

      // Then delete it
      const deleteResponse = await fetch(`${baseURL}/api/users/${createdUser.id}`, {
        method: 'DELETE'
      })

      expect(deleteResponse.status).toBe(204)

      // Verify it's gone
      const getResponse = await fetch(`${baseURL}/api/users/${createdUser.id}`)
      expect(getResponse.status).toBe(404)
    })

    it('should return 404 when deleting non-existent user', async () => {
      const response = await fetch(`${baseURL}/api/users/999999`, {
        method: 'DELETE'
      })
      
      expect(response.status).toBe(404)
    })
  })
})
