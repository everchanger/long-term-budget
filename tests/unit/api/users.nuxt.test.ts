import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

// Type definitions for our API responses
interface User {
  id: number
  name: string
  email: string
  createdAt: string
  updatedAt?: string
}

describe('Users API', async () => {
  await setup({
    // Test setup - Nuxt will handle the test environment
  })

  describe('POST /api/users', () => {
    it('should create a user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      }

      const response = await $fetch<User>('/api/users', {
        method: 'POST',
        body: userData
      })

      expect(response).toMatchObject({
        id: expect.any(Number),
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: expect.any(String)
      })
    })

    it('should validate required fields', async () => {
      try {
        await $fetch<User>('/api/users', {
          method: 'POST',
          body: {}
        })
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.response?.status).toBe(400)
      }
    })

    it('should validate email format', async () => {
      try {
        await $fetch<User>('/api/users', {
          method: 'POST',
          body: {
            name: 'John Doe',
            email: 'invalid-email'
          }
        })
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.response?.status).toBe(400)
      }
    })
  })

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const response = await $fetch<User[]>('/api/users')
      expect(Array.isArray(response)).toBe(true)
    })
  })

  describe('GET /api/users/:id', () => {
    it('should return a specific user', async () => {
      // First create a user
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      }
      
      const createdUser = await $fetch<User>('/api/users', {
        method: 'POST',
        body: userData
      })

      // Then fetch it by ID
      const response = await $fetch<User>(`/api/users/${createdUser.id}`)

      expect(response).toMatchObject({
        id: createdUser.id,
        name: 'Jane Doe',
        email: 'jane@example.com'
      })
    })

    it('should return 404 for non-existent user', async () => {
      try {
        await $fetch<User>('/api/users/999999')
        expect.fail('Should have thrown 404 error')
      } catch (error) {
        expect(error.response?.status).toBe(404)
      }
    })
  })

  describe('PUT /api/users/:id', () => {
    it('should update a user', async () => {
      // First create a user
      const userData = {
        name: 'Bob Smith',
        email: 'bob@example.com'
      }
      
      const createdUser = await $fetch<User>('/api/users', {
        method: 'POST',
        body: userData
      })

      // Then update it
      const updatedData = {
        name: 'Bob Updated',
        email: 'bob.updated@example.com'
      }

      const response = await $fetch<User>(`/api/users/${createdUser.id}`, {
        method: 'PUT',
        body: updatedData
      })

      expect(response).toMatchObject({
        id: createdUser.id,
        name: 'Bob Updated',
        email: 'bob.updated@example.com'
      })
    })

    it('should validate email format on update', async () => {
      // First create a user
      const userData = {
        name: 'Test User',
        email: 'test@example.com'
      }
      
      const createdUser = await $fetch<User>('/api/users', {
        method: 'POST',
        body: userData
      })

      try {
        await $fetch<User>(`/api/users/${createdUser.id}`, {
          method: 'PUT',
          body: {
            name: 'Test User',
            email: 'invalid-email'
          }
        })
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.response?.status).toBe(400)
      }
    })
  })

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      // First create a user
      const userData = {
        name: 'Delete Me',
        email: 'delete@example.com'
      }
      
      const createdUser = await $fetch<User>('/api/users', {
        method: 'POST',
        body: userData
      })

      // Then delete it
      await $fetch(`/api/users/${createdUser.id}`, {
        method: 'DELETE'
      })

      // Verify it's gone
      try {
        await $fetch<User>(`/api/users/${createdUser.id}`)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.response?.status).toBe(404)
      }
    })

    it('should return 404 when deleting non-existent user', async () => {
      try {
        await $fetch('/api/users/999999', {
          method: 'DELETE'
        })
        expect.fail('Should have thrown 404 error')
      } catch (error) {
        expect(error.response?.status).toBe(404)
      }
    })
  })
})
