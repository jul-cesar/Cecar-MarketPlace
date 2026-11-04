import 'dotenv/config'
import { Client } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const client = new Client({ connectionString: process.env.DATABASE_URL })

try {
  await client.connect()
  await migrate(drizzle(client), { migrationsFolder: './drizzle' })
} finally {
  await client.end()
}
