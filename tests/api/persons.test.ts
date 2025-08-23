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
}

interface Person {
  id: number
  name: string
  age?: number
  householdId: number
  createdAt: string
  householdName?: string
}

describe('/api/persons', async () => {
  await setup({
    server: true,
  })

  let testUser: User
  let testHousehold: Household

  beforeEach(async () => {
    // Clean up tables before each test
    if (testClient) {
      await testClient.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
      await testClient.query('TRUNCATE TABLE households RESTART IDENTITY CASCADE')
      await testClient.query('TRUNCATE TABLE persons RESTART IDENTITY CASCADE')
    }

    // Create test user and household for person tests
    testUser = await $fetch<User>('/api/users', {
      method: 'POST',
      body: { name: 'Test User', email: 'test@example.com' }
    })

    testHousehold = await $fetch<Household>('/api/households', {
      method: 'POST',
      body: { name: 'Test Family', user_id: testUser.id }
    })
  })

  afterEach(async () => {
    // Clean up after each test
    if (testClient) {
      await testClient.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
      await testClient.query('TRUNCATE TABLE households RESTART IDENTITY CASCADE')
      await testClient.query('TRUNCATE TABLE persons RESTART IDENTITY CASCADE')
    }
  })

  describe('POST /api/persons', () => {
    it('should create a new person', async () => {
      const personData = {
        name: 'John Smith',
        age: 30,
        household_id: testHousehold.id
      }

      const response = await $fetch<Person>('/api/persons', {
        method: 'POST',
        body: personData
      })

      expect(response).toMatchObject({
        id: expect.any(Number),
        name: 'John Smith',
        age: 30,
        householdId: testHousehold.id,
        createdAt: expect.any(String)
      })
    })

    it('should create a person without age', async () => {
      const personData = {
        name: 'Jane Smith',
        household_id: testHousehold.id
      }

      const response = await $fetch<Person>('/api/persons', {
        method: 'POST',
        body: personData
      })

      expect(response).toMatchObject({
        id: expect.any(Number),
        name: 'Jane Smith',
        age: null,
        householdId: testHousehold.id,
        createdAt: expect.any(String)
      })
    })

    it('should return 400 if name is missing', async () => {
      const personData = {
        age: 30,
        household_id: testHousehold.id
      }

      await expect($fetch('/api/persons', {
        method: 'POST',
        body: personData
      })).rejects.toThrow()
    })

    it('should return 400 if household_id is missing', async () => {
      const personData = {
        name: 'John Smith',
        age: 30
      }

      await expect($fetch('/api/persons', {
        method: 'POST',
        body: personData
      })).rejects.toThrow()
    })

    it('should return 400 if household does not exist', async () => {
      const personData = {
        name: 'John Smith',
        age: 30,
        household_id: 999
      }

      await expect($fetch('/api/persons', {
        method: 'POST',
        body: personData
      })).rejects.toThrow()
    })
  })

  describe('GET /api/persons', () => {
    it('should return empty array when no persons exist', async () => {
      const response = await $fetch<Person[]>('/api/persons')
      expect(response).toEqual([])
    })

    it('should return all persons with household info', async () => {
      const person1 = await $fetch<Person>('/api/persons', {
        method: 'POST',
        body: { name: 'John Smith', age: 30, household_id: testHousehold.id }
      })

      const person2 = await $fetch<Person>('/api/persons', {
        method: 'POST',
        body: { name: 'Jane Smith', age: 28, household_id: testHousehold.id }
      })

      const response = await $fetch<Person[]>('/api/persons')
      
      expect(response).toHaveLength(2)
      expect(response).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            name: 'John Smith', 
            age: 30,
            householdId: testHousehold.id,
            householdName: testHousehold.name 
          }),
          expect.objectContaining({ 
            name: 'Jane Smith', 
            age: 28,
            householdId: testHousehold.id,
            householdName: testHousehold.name 
          })
        ])
      )
    })
  })

  describe('GET /api/persons/[id]', () => {
    it('should return a specific person with household info', async () => {
      const person = await $fetch<Person>('/api/persons', {
        method: 'POST',
        body: { name: 'John Smith', age: 30, household_id: testHousehold.id }
      })

      const response = await $fetch<Person>(`/api/persons/${person.id}`)
      
      expect(response).toMatchObject({
        id: person.id,
        name: 'John Smith',
        age: 30,
        householdId: testHousehold.id,
        householdName: testHousehold.name
      })
    })

    it('should return 404 for non-existent person', async () => {
      await expect($fetch('/api/persons/999')).rejects.toThrow()
    })

    it('should return 400 for invalid person ID', async () => {
      await expect($fetch('/api/persons/invalid')).rejects.toThrow()
    })
  })

  describe('PUT /api/persons/[id]', () => {
    it('should update a person', async () => {
      const person = await $fetch<Person>('/api/persons', {
        method: 'POST',
        body: { name: 'John Smith', age: 30, household_id: testHousehold.id }
      })

      const updatedData = {
        name: 'John Updated',
        age: 31
      }

      const response = await $fetch<Person>(`/api/persons/${person.id}`, {
        method: 'PUT',
        body: updatedData
      })

      expect(response).toMatchObject({
        id: person.id,
        name: 'John Updated',
        age: 31,
        householdId: testHousehold.id
      })
    })

    it('should return 404 for non-existent person', async () => {
      const updatedData = {
        name: 'Updated Person',
        age: 25
      }

      await expect($fetch('/api/persons/999', {
        method: 'PUT',
        body: updatedData
      })).rejects.toThrow()
    })
  })

  describe('DELETE /api/persons/[id]', () => {
    it('should delete a person', async () => {
      const person = await $fetch<Person>('/api/persons', {
        method: 'POST',
        body: { name: 'John Smith', age: 30, household_id: testHousehold.id }
      })

      const response = await $fetch<{message: string}>(`/api/persons/${person.id}`, {
        method: 'DELETE'
      })

      expect(response).toEqual({ message: 'Person deleted successfully' })

      // Verify person is deleted
      await expect($fetch(`/api/persons/${person.id}`)).rejects.toThrow()
    })

    it('should return 404 for non-existent person', async () => {
      await expect($fetch('/api/persons/999', {
        method: 'DELETE'
      })).rejects.toThrow()
    })
  })
})
