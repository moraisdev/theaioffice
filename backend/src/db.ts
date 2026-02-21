import { Pool } from 'pg'

require('dotenv').config()

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})
