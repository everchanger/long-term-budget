import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { testClient } from '../setup'

interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

describe('/api/users', async () => {
  await setup({
    // Use the Nuxt server for API testing
    server: true,
  })

  beforeEach(async () => {
    // Clean up users table before each test
    if (testClient) {
      await testClient.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
    }
  })

  afterEach(async () => {
    // Clean up after each test
    if (testClient) {
      await testClient.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
    }
  })

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
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

    it('should return 400 if name is missing', async () => {
      const userData = {
        email: 'john@example.com'
      }

      await expect($fetch('/api/users', {
        method: 'POST',
        body: userData
      })).rejects.toThrow()
    })

    it('should return 400 if email is missing', async () => {
      const userData = {
        name: 'John Doe'
      }

      await expect($fetch('/api/users', {
        method: 'POST',
        body: userData
      })).rejects.toThrow()
    })
  })

  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await $fetch<User[]>('/api/users')
      expect(response).toEqual([])
    })

    it('should return all users', async () => {
      // Create test users
      const user1 = await $fetch<User>('/api/users', {
        method: 'POST',
        body: { name: 'John Doe', email: 'john@example.com' }
      })

      const user2 = await $fetch<User>('/api/users', {
        method: 'POST',
        body: { name: 'Jane Smith', email: 'jane@example.com' }
      })

      const response = await $fetch<User[]>('/api/users')
      
      expect(response).toHaveLength(2)
      expect(response).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'John Doe', email: 'john@example.com' }),
          expect.objectContaining({ name: 'Jane Smith', email: 'jane@example.com' })
        ])
      )
    })
  })

  describe('GET /api/users/[id]', () => {
    it('should return a specific user', async () => {
      const user = await $fetch<User>('/api/users', {
        method: 'POST',
        body: { name: 'John Doe', email: 'john@example.com' }
      })

      const response = await $fetch<User>(`/api/users/${user.id}`)
      
      expect(response).toMatchObject({
        id: user.id,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: expect.any(String)
      })
    })

    it('should return 404 for non-existent user', async () => {
      await expect($fetch('/api/users/999')).rejects.toThrow()
    })

    it('should return 400 for invalid user ID', async () => {
      await expect($fetch('/api/users/invalid')).rejects.toThrow()
    })
  })

  describe('PUT /api/users/[id]', () => {
    it('should update a user', async () => {
      const user = await $fetch<User>('/api/users', {
        method: 'POST',
        body: { name: 'John Doe', email: 'john@example.com' }
      })

      const updatedData = {
        name: 'John Updated',
        email: 'john.updated@example.com'
      }

      const response = await $fetch<User>(`/api/users/${user.id}`, {
        method: 'PUT',
        body: updatedData
      })

      expect(response).toMatchObject({
        id: user.id,
        name: 'John Updated',
        email: 'john.updated@example.com',
        createdAt: expect.any(String)
      })
    })

    it('should return 404 for non-existent user', async () => {
      const updatedData = {
        name: 'John Updated',
        email: 'john.updated@example.com'
      }

      await expect($fetch('/api/users/999', {
        method: 'PUT',
        body: updatedData
      })).rejects.toThrow()
    })
  })

  describe('DELETE /api/users/[id]', () => {
    it('should delete a user', async () => {
      const user = await $fetch<User>('/api/users', {
        method: 'POST',
        body: { name: 'John Doe', email: 'john@example.com' }
      })

      const response = await $fetch<{message: string}>(`/api/users/${user.id}`, {
        method: 'DELETE'
      })

      expect(response).toEqual({ message: 'User deleted successfully' })

      // Verify user is deleted
      await expect($fetch(`/api/users/${user.id}`)).rejects.toThrow()
    })

    it('should return 404 for non-existent user', async () => {
      await expect($fetch('/api/users/999', {
        method: 'DELETE'
      })).rejects.toThrow()
    })
  })
})
