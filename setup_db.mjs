import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

async function setupDatabase() {
    if (!process.env.DATABASE_URL) {
        console.error('Error: DATABASE_URL environment variable is missing.');
        console.log('Please add it to a .env file or set it in your environment.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Connecting to the database...');
        const client = await pool.connect();

        console.log('Reading database.sql...');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf-8');
        console.log('Executing database schema...');
        await client.query(schemaSql);
        console.log('Schema executed successfully.');

        console.log('Reading migration.sql...');
        const migrationSql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf-8');
        console.log('Executing migration...');

        // Split by semicolons for ALTER TABLE statements as some databases prefer them separate
        // Or run the whole string. PG handles multiple statements in query() fine.
        await client.query(migrationSql);
        console.log('Migration executed successfully.');

        console.log('\n✅ Database has been set up successfully and is ready to use!');

        client.release();
    } catch (error) {
        console.error('❌ Error setting up the database:', error);
    } finally {
        await pool.end();
    }
}

setupDatabase();
