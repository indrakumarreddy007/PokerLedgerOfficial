import type { Request, Response } from 'express';
import pool from './db.js';

export const handler = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"
        );

        let missingTables = [];
        try { await pool.query("SELECT 1 FROM sessions LIMIT 1"); } catch (e: any) { missingTables.push(`sessions: ${e.message}`); }
        try { await pool.query("SELECT 1 FROM session_players LIMIT 1"); } catch (e: any) { missingTables.push(`session_players: ${e.message}`); }
        try { await pool.query("SELECT 1 FROM buy_ins LIMIT 1"); } catch (e: any) { missingTables.push(`buy_ins: ${e.message}`); }

        return res.status(200).json({
            database_url_starts_with: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'MISSING',
            users_columns: result.rows.map(r => r.column_name),
            missing_tables_errors: missingTables
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
