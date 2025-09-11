import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { testClient } from '../setup'

interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

interface Household {
  id: number
  name: string
  userId: number
  createdAt: string
  ownerName?: string
  persons?: any[]
}

describe('/api/households', async () => {
  await setup({
    server: true,
  })

  let testUser: User

  beforeEach(async () => {
    // Clean up tables before each test
    if (testClient) {
      await testClient.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
      await testClient.query('TRUNCATE TABLE households RESTART IDENTITY CASCADE')
    }

    // Create a test user for household tests
    testUser = await $fetch<User>('/api/users', {
      method: 'POST',
      body: { name: 'Test User', email: 'test@example.com' }
    })
  })

  afterEach(async () => {
    // Clean up after each test
    if (testClient) {
      await testClient.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
      await testClient.query('TRUNCATE TABLE households RESTART IDENTITY CASCADE')
    }
  })

  describe('POST /api/households', () => {
    it('should create a new household', async () => {
      const householdData = {
        name: 'Smith Family',
        user_id: testUser.id
      }

      const response = await $fetch<Household>('/api/households', {
        method: 'POST',
        body: householdData
      })

      expect(response).toMatchObject({
        id: expect.any(Number),
        name: 'Smith Family',
        userId: testUser.id,
        createdAt: expect.any(String)
      })
    })

    it('should return 400 if name is missing', async () => {
      const householdData = {
        user_id: testUser.id
      }

      await expect($fetch('/api/households', {
        method: 'POST',
        body: householdData
      })).rejects.toThrow()
    })

    it('should return 400 if user_id is missing', async () => {
      const householdData = {
        name: 'Smith Family'
      }

      await expect($fetch('/api/households', {
        method: 'POST',
        body: householdData
      })).rejects.toThrow()
    })

    it('should return 400 if user does not exist', async () => {
      const householdData = {
        name: 'Smith Family',
        user_id: 999
      }

      await expect($fetch('/api/households', {
        method: 'POST',
        body: householdData
      })).rejects.toThrow()
    })
  })

  describe('GET /api/households', () => {
    it('should return empty array when no households exist', async () => {
      const response = await $fetch<Household[]>('/api/households')
      expect(response).toEqual([])
    })

    it('should return all households with owner info', async () => {
      const household1 = await $fetch<Household>('/api/households', {
        method: 'POST',
        body: { name: 'Smith Family', user_id: testUser.id }
      })

      const household2 = await $fetch<Household>('/api/households', {
        method: 'POST',
        body: { name: 'Johnson Family', user_id: testUser.id }
      })

      const response = await $fetch<Household[]>('/api/households')
      
      expect(response).toHaveLength(2)
      expect(response).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            name: 'Smith Family', 
            userId: testUser.id,
            ownerName: testUser.name 
          }),
          expect.objectContaining({ 
            name: 'Johnson Family', 
            userId: testUser.id,
            ownerName: testUser.name 
          })
        ])
      )
    })
  })

  describe('GET /api/households/[id]', () => {
    it('should return a specific household with persons', async () => {
      const household = await $fetch<Household>('/api/households', {
        method: 'POST',
        body: { name: 'Smith Family', user_id: testUser.id }
      })

      const response = await $fetch<Household>(`/api/households/${household.id}`)
      
      expect(response).toMatchObject({
        id: household.id,
        name: 'Smith Family',
        userId: testUser.id,
        ownerName: testUser.name,
        persons: expect.any(Array)
      })
    })

    it('should return 404 for non-existent household', async () => {
      await expect($fetch('/api/households/999')).rejects.toThrow()
    })

    it('should return 400 for invalid household ID', async () => {
      await expect($fetch('/api/households/invalid')).rejects.toThrow()
    })
  })

  describe('PUT /api/households/[id]', () => {
    it('should update a household', async () => {
      const household = await $fetch<Household>('/api/households', {
        method: 'POST',
        body: { name: 'Smith Family', user_id: testUser.id }
      })

      const updatedData = {
        name: 'Smith-Johnson Family'
      }

      const response = await $fetch<Household>(`/api/households/${household.id}`, {
        method: 'PUT',
        body: updatedData
      })

      expect(response).toMatchObject({
        id: household.id,
        name: 'Smith-Johnson Family',
        userId: testUser.id
      })
    })

    it('should return 404 for non-existent household', async () => {
      const updatedData = {
        name: 'Updated Family'
      }

      await expect($fetch('/api/households/999', {
        method: 'PUT',
        body: updatedData
      })).rejects.toThrow()
    })
  })

  describe('DELETE /api/households/[id]', () => {
    it('should delete a household', async () => {
      const household = await $fetch<Household>('/api/households', {
        method: 'POST',
        body: { name: 'Smith Family', user_id: testUser.id }
      })

      const response = await $fetch<{message: string}>(`/api/households/${household.id}`, {
        method: 'DELETE'
      })

      expect(response).toEqual({ message: 'Household deleted successfully' })

      // Verify household is deleted
      await expect($fetch(`/api/households/${household.id}`)).rejects.toThrow()
    })

    it('should return 404 for non-existent household', async () => {
      await expect($fetch('/api/households/999', {
        method: 'DELETE'
      })).rejects.toThrow()
    })
  })
})
