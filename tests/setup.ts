import { beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'

let testClient: Client

beforeAll(async () => {
  // Create test database connection
  testClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'budgetuser',
    password: process.env.DB_PASSWORD || 'budgetpass',
    database: process.env.DB_NAME || 'budgetdb_test',
    ssl: false,
  })

  try {
    await testClient.connect()
    console.log('Test database connected')
  } catch (error) {
    console.warn('Test database connection failed, tests may not work properly:', error)
  }
})

afterAll(async () => {
  if (testClient) {
    await testClient.end()
  }
})

export { testClient }
