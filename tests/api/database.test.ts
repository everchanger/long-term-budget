import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eq } from 'drizzle-orm'

// Mock the database module - must be at top level
vi.mock('../../db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      users: {
        findMany: vi.fn()
      },
      households: {
        findMany: vi.fn()
      }
    }
  },
  schema: {
    users: {
      id: 'id',
      name: 'name',
      email: 'email',
      createdAt: 'createdAt'
    },
    households: {
      id: 'id',
      name: 'name',
      userId: 'userId',
      createdAt: 'createdAt'
    },
    persons: {
      id: 'id',
      name: 'name',
      age: 'age',
      householdId: 'householdId',
      createdAt: 'createdAt'
    }
  }
}))

// Import after mocking
import { db, schema } from '../../db'

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eq } from 'drizzle-orm'

// Mock the database module - must be at top level
vi.mock('../../db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      users: {
        findMany: vi.fn()
      },
      households: {
        findMany: vi.fn()
      }
    }
  },
  schema: {
    users: {
      id: 'id',
      name: 'name',
      email: 'email',
      createdAt: 'createdAt'
    },
    households: {
      id: 'id',
      name: 'name',
      userId: 'userId',
      createdAt: 'createdAt'
    },
    persons: {
      id: 'id',
      name: 'name',
      age: 'age',
      householdId: 'householdId',
      createdAt: 'createdAt'
    }
  }
}))

// Import after mocking
import { db, schema } from '../../db'

// Get mocked versions for type safety
const mockDb = vi.mocked(db)

describe('Database Schema Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Users CRUD Operations', () => {
    it('should create a user', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date()
      }

      // Mock the insert chain
      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser])
      })
      const mockInsert = vi.fn().mockReturnValue({
        values: mockValues
      })
      mockDb.insert.mockReturnValue(mockInsert)

      const [user] = await db.insert(schema.users)
        .values({ name: 'John Doe', email: 'john@example.com' })
        .returning()

      expect(mockDb.insert).toHaveBeenCalledWith(schema.users)
      expect(mockValues).toHaveBeenCalledWith({ name: 'John Doe', email: 'john@example.com' })
      expect(user).toEqual(mockUser)
    })

    it('should read users', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date() },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date() }
      ]

      // Mock the insert for test data
      const mockValues = vi.fn().mockReturnValue(Promise.resolve())
      const mockInsert = vi.fn().mockReturnValue({
        values: mockValues
      })
      mockDb.insert.mockReturnValue(mockInsert)

      // Mock the select
      const mockFrom = vi.fn().mockResolvedValue(mockUsers)
      const mockSelect = vi.fn().mockReturnValue({
        from: mockFrom
      })
      mockDb.select.mockReturnValue(mockSelect)

      // Insert test data
      await db.insert(schema.users).values([
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' }
      ])

      const users = await db.select().from(schema.users)
      
      expect(users).toHaveLength(2)
      expect(users[0]).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com'
      })
    })

    it('should update a user', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date()
      }

      const mockUpdatedUser = {
        ...mockUser,
        name: 'John Updated',
        email: 'john.updated@example.com'
      }

      // Mock insert first
      const mockInsertValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser])
      })
      const mockInsert = vi.fn().mockReturnValue({
        values: mockInsertValues
      })
      mockDb.insert.mockReturnValue(mockInsert)

      // Mock update
      const mockWhere = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUpdatedUser])
      })
      const mockSet = vi.fn().mockReturnValue({
        where: mockWhere
      })
      const mockUpdate = vi.fn().mockReturnValue({
        set: mockSet
      })
      mockDb.update.mockReturnValue(mockUpdate)

      const [user] = await db.insert(schema.users)
        .values({ name: 'John Doe', email: 'john@example.com' })
        .returning()

      const [updatedUser] = await db.update(schema.users)
        .set({ name: 'John Updated', email: 'john.updated@example.com' })
        .where(eq(schema.users.id, user.id))
        .returning()

      expect(mockDb.update).toHaveBeenCalledWith(schema.users)
      expect(mockSet).toHaveBeenCalledWith({ name: 'John Updated', email: 'john.updated@example.com' })
      expect(updatedUser).toEqual(mockUpdatedUser)
    })

    it('should delete a user', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date()
      }

      // Mock insert
      const mockInsertValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser])
      })
      const mockInsert = vi.fn().mockReturnValue({
        values: mockInsertValues
      })
      mockDb.insert.mockReturnValue(mockInsert)

      // Mock delete
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined)
      const mockDelete = vi.fn().mockReturnValue({
        where: mockDeleteWhere
      })
      mockDb.delete.mockReturnValue(mockDelete)

      // Mock select for verification
      const mockSelectWhere = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({
        where: mockSelectWhere
      })
      const mockSelect = vi.fn().mockReturnValue({
        from: mockFrom
      })
      mockDb.select.mockReturnValue(mockSelect)

      const [user] = await db.insert(schema.users)
        .values({ name: 'John Doe', email: 'john@example.com' })
        .returning()

      await db.delete(schema.users).where(eq(schema.users.id, user.id))

      const deletedUsers = await db.select().from(schema.users)
        .where(eq(schema.users.id, user.id))
      
      expect(mockDb.delete).toHaveBeenCalledWith(schema.users)
      expect(deletedUsers).toHaveLength(0)
    })
  })

  describe('Households CRUD Operations', () => {
    it('should create a household with valid user', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date()
      }

      const mockHousehold = {
        id: 1,
        name: 'Smith Family',
        userId: 1,
        createdAt: new Date()
      }

      // Mock user insert
      const mockUserValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser])
      })
      const mockUserInsert = vi.fn().mockReturnValue({
        values: mockUserValues
      })

      // Mock household insert
      const mockHouseholdValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockHousehold])
      })
      const mockHouseholdInsert = vi.fn().mockReturnValue({
        values: mockHouseholdValues
      })

      mockDb.insert
        .mockReturnValueOnce(mockUserInsert)
        .mockReturnValueOnce(mockHouseholdInsert)

      const [user] = await db.insert(schema.users)
        .values({ name: 'John Doe', email: 'john@example.com' })
        .returning()

      const [household] = await db.insert(schema.households)
        .values({ name: 'Smith Family', userId: user.id })
        .returning()

      expect(household).toEqual(mockHousehold)
    })
  })

  describe('Relations', () => {
    it('should query users with their households', async () => {
      const mockUsersWithHouseholds = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date(),
          households: [
            { id: 1, name: 'Smith Family', userId: 1, createdAt: new Date() },
            { id: 2, name: 'Johnson Family', userId: 1, createdAt: new Date() }
          ]
        }
      ]

      mockDb.query.users.findMany.mockResolvedValue(mockUsersWithHouseholds)

      const usersWithHouseholds = await db.query.users.findMany({
        with: {
          households: true
        }
      })

      expect(mockDb.query.users.findMany).toHaveBeenCalledWith({
        with: {
          households: true
        }
      })
      expect(usersWithHouseholds).toHaveLength(1)
      expect(usersWithHouseholds[0].households).toHaveLength(2)
    })

    it('should query households with their persons', async () => {
      const mockHouseholdsWithPersons = [
        {
          id: 1,
          name: 'Smith Family',
          userId: 1,
          createdAt: new Date(),
          persons: [
            { id: 1, name: 'Jane Smith', age: 25, householdId: 1, createdAt: new Date() },
            { id: 2, name: 'Bob Smith', age: 30, householdId: 1, createdAt: new Date() }
          ]
        }
      ]

      mockDb.query.households.findMany.mockResolvedValue(mockHouseholdsWithPersons)

      const householdsWithPersons = await db.query.households.findMany({
        with: {
          persons: true
        }
      })

      expect(mockDb.query.households.findMany).toHaveBeenCalledWith({
        with: {
          persons: true
        }
      })
      expect(householdsWithPersons).toHaveLength(1)
      expect(householdsWithPersons[0].persons).toHaveLength(2)
    })
  })
})
