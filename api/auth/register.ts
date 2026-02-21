import type { Request, Response } from 'express';
import pool from '../db.js';

export const handler = async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Check if username exists
        const userCheck = await pool.query('SELECT id FROM users WHERE lower(username) = lower($1)', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        const result = await pool.query(
            'INSERT INTO users (name, username, password) VALUES ($1, $2, $3) RETURNING id, name, username',
            [name, username, password]
        );

        const newUser = result.rows[0];
        return res.status(201).json({ success: true, user: newUser });
    } catch (error: any) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: `Registration Failed: ${error.message}` });
    }
}
