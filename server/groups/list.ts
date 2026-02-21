import type { Request, Response } from 'express';
import pool from '../db.js';

export const handler = async (req: Request, res: Response) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        const result = await pool.query(
            `SELECT g.*, gm.role, gm.joined_at 
             FROM groups g
             JOIN group_members gm ON g.id = gm.group_id
             WHERE gm.user_id = $1
             ORDER BY g.created_at DESC`,
            [userId]
        );

        return res.status(200).json({ success: true, groups: result.rows });
    } catch (error: any) {
        console.error('List groups error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
