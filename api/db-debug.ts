import type { Request, Response } from 'express';
import pool from '../db.js';

export const handler = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"
        );

        return res.status(200).json({
            database_url_starts_with: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'MISSING',
            users_columns: result.rows.map(r => r.column_name)
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
