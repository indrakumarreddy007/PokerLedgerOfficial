import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Starting migration...');
        await client.query('BEGIN');

        console.log('Creating groups table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          join_code TEXT UNIQUE NOT NULL,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

        console.log('Creating group_members table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS group_members (
          group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY (group_id, user_id)
      );
    `);

        console.log('Altering sessions table...');
        await client.query(`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
    `);

        console.log('Adding indexes...');
        await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_group ON sessions(group_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);`);

        await client.query('COMMIT');
        console.log('Migration completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
