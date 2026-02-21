import type { Request, Response } from 'express';
import pool from '../db.js';
import crypto from 'crypto';

export const handler = async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, createdBy } = req.body;

    if (!name || !createdBy) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const groupResult = await client.query(
                `INSERT INTO groups (name, join_code, created_by) VALUES ($1, $2, $3) RETURNING *`,
                [name, joinCode, createdBy]
            );

            const group = groupResult.rows[0];

            await client.query(
                `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'owner')`,
                [group.id, createdBy]
            );

            await client.query('COMMIT');

            return res.status(201).json({ success: true, group });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Create group error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
