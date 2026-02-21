import type { Request, Response } from 'express';
import pool from '../db.js';

export const handler = async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, joinCode } = req.body;
    if (!userId || !joinCode) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const groupCheck = await pool.query('SELECT id FROM groups WHERE join_code = $1', [joinCode]);
        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid join code' });
        }

        const groupId = groupCheck.rows[0].id;

        const memberCheck = await pool.query('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
        if (memberCheck.rows.length > 0) {
            return res.status(200).json({ success: true, message: 'Already a member', groupId });
        }

        await pool.query('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)', [groupId, userId, 'member']);

        return res.status(200).json({ success: true, groupId });
    } catch (error: any) {
        console.error('Join group error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
